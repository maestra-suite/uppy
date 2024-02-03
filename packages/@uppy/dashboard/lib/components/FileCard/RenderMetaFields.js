import { h } from 'preact';
export default function RenderMetaFields(props) {
  const {
    computedMetaFields,
    requiredMetaFields,
    updateMeta,
    form,
    formState
  } = props;
  const fieldCSSClasses = {
    text: 'uppy-u-reset uppy-c-textInput uppy-Dashboard-FileCard-input'
  };
  return computedMetaFields.map(field => {
    const id = `uppy-Dashboard-FileCard-input-${field.id}`;
    const required = requiredMetaFields.includes(field.id);
    return h("fieldset", {
      key: field.id,
      className: "uppy-Dashboard-FileCard-fieldset"
    }, h("label", {
      className: "uppy-Dashboard-FileCard-label",
      htmlFor: id
    }, field.name), field.render !== undefined ? field.render({
      value: formState[field.id],
      onChange: newVal => updateMeta(newVal, field.id),
      fieldCSSClasses,
      required,
      form: form.id
    }, h) : h("input", {
      className: fieldCSSClasses.text,
      id: id,
      form: form.id,
      type: field.type || 'text',
      required: required,
      value: formState[field.id],
      placeholder: field.placeholder,
      onInput: ev => updateMeta(ev.target.value, field.id),
      "data-uppy-super-focusable": true
    }));
  });
}