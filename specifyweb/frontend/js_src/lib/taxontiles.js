"use strict";

import $ from 'jquery';
import _ from 'underscore';
import d3 from 'd3';

import {schema} from './schema';
import {ajax} from './ajax';
import {f} from './functools';
import {welcomeText} from './localization/welcome';

export function makeTreeMap(container) {
  container.classList.add('h-[473px]');

  const color = d3.scale.category20c();

  const treemap = d3.layout
    .treemap()
    .size([container.clientWidth, container.clientHeight])
    .sort(function (a, b) {
      return b.id - a.id;
    })
    .value(function (d) {
      return d.count;
    });

  const div = d3.select(container)
    .append('div')
    .attr('class', 'treemap')
    .style('position', 'relative')
    .style('width', `${container.clientWidth}px`)
    .style('height', `${container.clientHeight}px`)

  const genusTreeDefItem = new schema.models.TaxonTreeDefItem.LazyCollection({
    filters: {name: 'Genus'},
  });

  const getGenusRankID = genusTreeDefItem.fetch({limit: 1}).then(() =>
    genusTreeDefItem.length > 0
      ? genusTreeDefItem.at(0).get('rankid')
      : null
  );

  const getTreeData = ajax('/barvis/taxon_bar/', {headers: {Accept: 'application/json'}})
    .then(({data})=>data);

  Promise.all([getTreeData, getGenusRankID]).then(function buildFromData([
    data,
    genusRankID
  ]) {
    const tree = buildTree(data);
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
      .attr('class', 'node border dark:border-neutral-700 absolute opacity-80')
      .attr('title', makeName)
      .style('background', function (d) {
        return d.children ? null : color(d.name);
      });

    container.addEventListener('mouseover', ({target})=>
      f.maybe(target.closest('.node')?.getAttribute('title'),
          (textContent)=>title.textContent = textContent)
    )

    $('<p>', {
      title: welcomeText('taxonTilesDescription')(thres),
      class: 'absolute top-3 right-3 bg-white dark:bg-black py-0 px-2 opacity-80 border',
    })
      .text(welcomeText('taxonTiles'))
      .appendTo(div[0])

    const title = $('<p>', {
      class: 'absolute bottom-3 right-3 bg-white dark:bg-black py-0 px-2 opacity-80 border',
    })
      .appendTo(div[0])[0]
  });
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

  _.each(data, function ([id, rankId, parentId, name, count]) {
    const node = {id, rankId, parentId, name, count, children: []};

    if(parentId === null) roots.push(node);
    nodes[id] = node;
    histo[count] ??= 0;
    histo[count] += 1;
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
