import $ from 'jquery';
import uniquifyName from './wbuniquifyname';
import Backbone from './backbone';
import app from './specifyapp';
import { format } from './dataobjformatters';
import schema from './schema';
import resourceApi from './resourceapi';
import navigation from './navigation';
import userInfo from './userinfo.js';

export default Backbone.View.extend({
  __name__: 'DataSetNameView',
  events: {
    'click .ui-icon': 'startEditing',
  },
  initialize({ dataset }) {
    this.dataset = dataset;
    this.dialog = null;
    this.model = schema.getModel('agent');
    this.createdByAgent = null;
    this.modifiedByAgent = null;
    this.changeOwnerDialog = null;
    this.listOfUsers = null;
  },
  render() {
    if (this.dialog !== null) {
      this.dialog.remove();
      this.dialog = null;
    }

    this.$el.find('.wb-name').text('Data Set: ' + this.dataset.name).append(`
      <span
        class="ui-icon ui-icon-pencil"
        title="Edit name"
      >Edit name</span>`);
    app.setTitle(this.dataset.name);
    return this;
  },
  fetchAgent(agentString) {
    return new Promise((resolve) => {
      if (agentString === null) resolve(null);
      const agentId = resourceApi.idFromUrl(agentString);
      const createdByAgentResource = new this.model.Resource({
        id: agentId,
      });
      format(createdByAgentResource).done(resolve);
    });
  },
  loadAgentInfo(createdByField, modifiedByField) {
    if (this.createdByAgent !== null) {
      this.showAgentInfo(createdByField, modifiedByField);
      return;
    }

    const sameAgent =
      this.dataset.createdbyagent === this.dataset.modifiedbyagent;
    const createdByAgent = this.fetchAgent(this.dataset.createdbyagent);
    const modifiedByAgent = sameAgent
      ? Promise.resolve()
      : this.fetchAgent(this.dataset.modifiedbyagent);

    Promise.all([createdByAgent, modifiedByAgent]).then(
      ([createdByAgent, modifiedByAgent]) => {
        this.createdByAgent = createdByAgent;
        this.modifiedByAgent = sameAgent ? createdByAgent : modifiedByAgent;
        this.showAgentInfo(createdByField, modifiedByField);
      }
    );
  },
  showAgentInfo(createdByField, modifiedByField) {
    createdByField.text(this.createdByAgent ?? 'null');
    modifiedByField.text(this.modifiedByAgent ?? 'null');
  },
  startEditing() {
    if (this.dialog !== null) return;

    this.dialog = $(`<div>
      <label>
        Dataset Name:<br>
        <input
          type="text"
          style="
            display: block;
            width: 100%
          "
          class="dataset-name"
          value="${this.dataset.name}"
        >
      </label><br>
      <label>
        Remarks:<br>
        <textarea
          style="width: 100%"
          class="dataset-remarks"
        >${this.dataset.remarks ?? ''}</textarea>
      </label><br><br>
      <b>Data Set Metadata:</b><br>
      Number of rows: <i>${this.dataset.rows.length}</i><br>
      Number of columns: <i>${this.dataset.rows[0].length}</i><br>
      Date created: <i>${new Date(
        this.dataset.timestampcreated
      ).toLocaleString()}</i><br>
      Date modified: <i>${new Date(
        this.dataset.timestampmodified
      ).toLocaleString()}</i><br>
      Created By: <i class="created-by-field">Loading...</i><br>
      Modified By: <i class="modified-by-field"></i><br>
      Imported file name: <i>${this.dataset.importedfilename}</i><br><br>
    </div>`).dialog({
      title: 'Edit Data Set metadata',
      modal: true,
      open(evt, ui) {
        $('.ui-dialog-titlebar-close', ui.dialog).hide();
      },
      close: () => this.render(),
      buttons: {
        Cancel: () => this.render(),
        Save: this.setName.bind(this, this.render.bind(this)),
      },
    });

    this.dialog
      .find('.change-data-set-owner')
      .on('click', this.setName.bind(this, this.changeOwnerWindow.bind(this)));
    this.dialog.find('.export-data-set').on('click', this.handleExport);
    this.dialog.find('.delete-data-set').on('click', this.handleDelete);

    this.loadAgentInfo(
      this.dialog.find('.created-by-field'),
      this.dialog.find('.modified-by-field')
    );
  },
  setName(callback) {
    if (this.dialog === null) return;

    const [newName, newRemarks] = ['.dataset-name', '.dataset-remarks']
      .map((fieldClassName) => this.dialog.find(fieldClassName).val().trim())
      .map((value) => (value === '' ? null : value));

    if (
      newName === this.dialog.name &&
      newRemarks === this.dialog.remarks.toString()
    )
      callback();
    else {
      uniquifyName(newName, this.dataset.id).done((uniqueName) => {
        $.ajax(`/api/workbench/dataset/${this.dataset.id}/`, {
          type: 'PUT',
          data: JSON.stringify({ name: uniqueName, remarks: newRemarks }),
          contentType: 'application/json',
          processData: false,
        }).done(() => {
          this.dataset.name = uniqueName;
          this.dataset.remarks = newRemarks;
          callback();
        });
      });
    }
  },
  fetchListOfUsers() {
    return new Promise((resolve) =>
      this.listOfUsers === null
        ? fetch('/api/specify/specifyuser/?limit=500')
            .then((response) => response.json())
            .then(({ objects: users }) =>
              resolve(
                (this.listOfUsers = users
                  .map((user) => ({
                    id: user.id,
                    name: user.name,
                  }))
                  .filter(({ id }) => id !== userInfo.id))
              )
            )
        : resolve(this.listOfUsers)
    );
  },
  changeOwnerWindow() {
    this.fetchListOfUsers().then((users) => {
      this.changeOwnerDialog = $(`<div>
        Select new owner:<br>
        <select class="select-user-picklist" size="10" style="width:100%">
          ${users
            .map(
              (user) => `<option value="${user.id}">
            ${user.name}
          </option>`
            )
            .join('<br>')}
        </select>
      </div>`).dialog({
        title: 'Change Data Set Ownership',
        modal: true,
        open(evt, ui) {
          $('.ui-dialog-titlebar-close', ui.dialog).hide();
        },
        close: () => this.changeOwnerDialog.dialog('destroy'),
        buttons: {
          Cancel: () => this.changeOwnerDialog.dialog('destroy'),
          'Change owner': this.changeOwner.bind(this),
        },
      });
    });
  },
  changeOwner() {
    const selectedOwner = this.changeOwnerDialog
      .find('.select-user-picklist')
      .val();
    if (!selectedOwner) return;
    $.post(`/api/workbench/transfer/${this.dataset.id}/`, {
      specifyuserid: selectedOwner,
    })
      .done(() => navigation.go('/specify/'))
      .fail((error) => {
        throw error;
      });
  },
});
