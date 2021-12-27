"use strict";

import '../css/welcome.css';

import $ from 'jquery';
import _ from 'underscore';
import d3 from 'd3';

import Backbone from './backbone';
import * as app from './specifyapp';
import schema from './schema';
import remotePrefs from './remoteprefs';
import systemInfo from './systeminfo';
import aboutspecify from './templates/aboutspecify.html';
import welcomeText from './localization/welcome';
import commonText from './localization/common';

const DO_TAXON_TILES = remotePrefs['sp7.doTaxonTiles'] == "true";
const defaultWelcomeScreenImage = '/static/img/icons_as_background_small.png';
const welcomeScreenUrl =
  remotePrefs['sp7.welcomeScreenUrl'] || defaultWelcomeScreenImage;

function makeTreeMap() {
  const treeContainer = $('#welcome-screen-content');
  treeContainer[0].classList.add('taxon-treemap');

  const width = treeContainer.width();
  const height = treeContainer.height();

  const color = d3.scale.category20c();

  const treemap = d3.layout
    .treemap()
    .size([width, height])
    .sort(function (a, b) {
      return b.id - a.id;
    })
    .value(function (d) {
      return d.count;
    });

  const div = d3
    .select('#welcome-screen-content')
    .append('div')
    .attr('class', 'treemap')
    .style('position', 'relative')
    .style('width', width + 'px')
    .style('height', height + 'px');

  const genusTreeDefItem = new schema.models.TaxonTreeDefItem.LazyCollection({
    filters: { name: 'Genus' },
  });

  const getGenusRankID = genusTreeDefItem.fetch({ limit: 1 }).pipe(function () {
    return genusTreeDefItem.length > 0
      ? genusTreeDefItem.at(0).get('rankid')
      : null;
  });

  const getTreeData = $.getJSON('/barvis/taxon_bar/');

  $.when(getTreeData, getGenusRankID).done(function buildFromData(
    data,
    genusRankID
  ) {
    const tree = buildTree(data[0]);
    const root = tree[0];
    const thres = tree[1];
    let makeName;

    if (_.isNull(genusRankID))
      makeName = (d) =>
        (function recur(d) {
          return d.parent ? recur(d.parent) + ' ' + d.name : '';
        })(d.parent) +
        ' ' +
        d.count;
    else
      makeName = function (d) {
        const name =
          d.rankId <= genusRankID
            ? d.name
            : (function recur(d) {
                return d.parent && d.rankId >= genusRankID
                  ? recur(d.parent) + ' ' + d.name
                  : '';
              })(d.parent);

        name === '' &&
          console.error('empty name for', d, 'with rankId', d.rankId);
        return name + ' ' + d.count;
      };

    div
      .selectAll('.node')
      .data(
        treemap.nodes(root).filter(function (d) {
          return !d.children;
        })
      )
      .enter()
      .append('div')
      .attr('class', 'node')
      .call(position)
      .attr('title', makeName)
      .style('background', function (d) {
        return d.children ? null : color(d.name);
      });

    _.defer(function addToolTips() {
      $('.treemap .node').tooltip({ track: true, show: false, hide: false });
    });

    $('<p>', { title: welcomeText('taxonTilesDescription')(thres) })
      .text(welcomeText('taxonTiles'))
      .appendTo(div[0])
      .tooltip({ track: true, show: false, hide: false });
  });
}

function drawWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcome-screen-content');
  fetch(welcomeScreenUrl, { method: 'HEAD' })
    .then(({ headers }) =>
      draw(headers.get('Content-Type')?.startsWith('image'), welcomeScreenUrl)
    )
    .catch(() => draw(true, defaultWelcomeScreenImage));

  function draw(isImage, url) {
    welcomeScreen.classList.add(
      isImage ? 'welcome-screen-image' : 'welcome-screen-iframe'
    );
    welcomeScreen.innerHTML = isImage
      ? `<img src="${url}" alt="">`
      : `<iframe src="${url}"></iframe>`;
  }
}

function position() {
  this.style('left', function (d) {
    return d.x + 'px';
  })
    .style('top', function (d) {
      return d.y + 'px';
    })
    .style('width', function (d) {
      return Math.max(0, d.dx - 1) + 'px';
    })
    .style('height', function (d) {
      return Math.max(0, d.dy - 1) + 'px';
    });
}

function buildTree(data) {
  const roots = [];
  const nodes = [];
  const histo = [];

  _.each(data, function (datum) {
    let i = 0;
    const node = {
      id: datum[i++],
      rankId: datum[i++],
      parentId: datum[i++],
      name: datum[i++],
      count: datum[i++],
      children: [],
    };

    _.isNull(node.parentId) && roots.push(node);
    nodes[node.id] = node;
    histo[node.count] = (histo[node.count] || 0) + 1;
  });

  // This is to try to limit the number of treemap squares to ~1000. For some
  // reason it doesn't quite do that, but since this is just for eye candy
  // anyways, it seems to work well enough.

  let thres = histo.length - 1;
  for (let total = 0; thres > 0; thres--) {
    total += histo[thres] || 0;
    if (total > 1000) break;
  }

  _.each(nodes, function (node) {
    if (!node || !node.parentId) return;
    const parent = nodes[node.parentId];
    if (parent) parent.children.push(node);
    else console.warn('taxon node with missing parent:', node);
  });

  function pullUp(node) {
    if (node.children) {
      const children = [];
      let thisCount = node.count;
      let total = node.count;
      _.each(node.children, function (child) {
        const childCount = pullUp(child);
        total += childCount;
        if (childCount < thres) {
          thisCount += childCount;
        } else {
          children.push(child);
        }
      });
      if (thisCount > thres)
        children.push({
          count: thisCount,
          name: node.name,
          rankId: node.rankId,
        });
      node.children = children;
      return total;
    } else return node.count;
  }

  const root = roots[0];
  pullUp(root);
  return [root, thres];
}

const WelcomeView = Backbone.View.extend({
  __name__: 'WelcomeView',
  className: 'specify-welcome',
  events: {
    'click #about-specify': 'showAboutDialog',
  },
  render: function () {
    $(`
      <div id="welcome-screen-content"></div>

      <p class="welcome-footer">
        <a href="#" id="about-specify" title="${welcomeText('aboutSpecify')}">
          <img
            src="/static/img/specify_7_small.png"
            alt="${welcomeText('aboutSpecify')}"
          >
        </a>
      </p>
    `).appendTo(this.$el);

    _.defer(DO_TAXON_TILES ? makeTreeMap : drawWelcomeScreen);

    return this;
  },
  showAboutDialog: function (evt) {
    evt.preventDefault();
    $(
      aboutspecify({
        ...systemInfo,
        welcomeText,
        commonText,
      })
    ).dialog({
      title: welcomeText('aboutSpecifyDialogTitle'),
      width: 480,
      close: function () {
        $(this).remove();
      },
    });
  },
});

exprot default function (){
  app.setCurrentView(new WelcomeView());
}
