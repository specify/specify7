import $ from 'jquery';
import uniquifyName from './wbuniquifyname.js';
import Backbone from './backbone';
import app from './specifyapp.js';

export default Backbone.View.extend({
  __name__: 'DataSetNameView',
  events: {
    'click .ui-icon': 'startEditing',
  },
  initialize({ dataset }) {
    this.dataset = dataset;
    this.dialog = null;
  },
  render() {
    if (this.dialog !== null) {
      this.dialog.remove();
      this.dialog = null;
    }

    this.$el.text('Data Set: ' + this.dataset.name).append(`
      <span
        class="ui-icon ui-icon-pencil"
        title="Edit name"
      >Edit name</span>`);
    app.setTitle(this.dataset.name);
    return this;
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
      Imported file name: <i>${this.dataset.importedfilename}</i><br>
    </div>`).dialog({
      title: 'Edit dataset metadata',
      modal: true,
      open(evt, ui) {
        $('.ui-dialog-titlebar-close', ui.dialog).hide();
      },
      close: () => this.render(),
      buttons: {
        Cancel: () => this.render(),
        Save: this.setName.bind(this),
      },
    });
  },
  setName() {
    if (this.dialog === null) return;

    const [newName, newRemarks] = ['.dataset-name', '.dataset-remarks']
      .map((fieldClassName) => this.dialog.find(fieldClassName).val().trim())
      .map((value) => (value === '' ? null : value));

    if (
      newName === this.dialog.name &&
      newRemarks === this.dialog.remarks.toString()
    )
      this.render();
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
          this.render();
        });
      });
    }
  },
});
