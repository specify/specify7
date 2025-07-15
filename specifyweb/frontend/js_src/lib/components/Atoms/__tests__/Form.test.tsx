import React from 'react';

import { mount, snapshot } from '../../../tests/reactUtils';
import type { RA } from '../../../utils/types';
import { className } from '../className';
import { Form, Input, Label, Select, Textarea } from '../Form';

snapshot(Label.Block, { children: 'Test' });
snapshot(Label.Inline, { children: 'Test' });

test('<Form> removes notSubmitted class name on submit', async () => {
  const { asFragment, getByRole, user } = mount(
    <Form aria-label="form" onSubmit={(event): void => event.preventDefault()}>
      <input type="submit" />
    </Form>
  );
  const form = getByRole('form');
  expect(form).toHaveClass(className.notSubmittedForm);

  const button = getByRole('button');
  await user.click(button);

  expect(form).not.toHaveClass(className.notSubmittedForm);

  expect(asFragment()).toMatchSnapshot();
});

describe('<Input.Radio>', () => {
  test('ignores change if disabled', async () => {
    const handleChange = jest.fn();
    const { asFragment, getByRole, user } = mount(
      <Input.Radio disabled onChange={handleChange} />
    );
    const radio = getByRole('radio');
    await user.click(radio);

    expect(handleChange).not.toHaveBeenCalled();
    expect(asFragment()).toMatchSnapshot();
  });

  test('removes notTouched className from siblings', async () => {
    const { getAllByRole, user } = mount(
      <>
        <Input.Radio name="a" />
        <Input.Radio name="a" />
      </>
    );
    const radios = getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[0]).toHaveClass(className.notTouchedInput);
    expect(radios[1]).toHaveClass(className.notTouchedInput);
    await user.click(radios[0]);
    radios[0].blur();
    expect(radios[0]).not.toHaveClass(className.notTouchedInput);
    expect(radios[1]).not.toHaveClass(className.notTouchedInput);
  });
});

describe('<Input.Checkbox>', () => {
  test('calls onValueChange on click', async () => {
    const handleChange = jest.fn();
    const { asFragment, getByRole, user } = mount(
      <Input.Checkbox onValueChange={handleChange} />
    );

    const checkbox = getByRole('checkbox');
    await user.click(checkbox);
    expect(handleChange).toHaveBeenLastCalledWith(true);
    await user.click(checkbox);
    expect(handleChange).toHaveBeenLastCalledWith(false);
    expect(asFragment()).toMatchSnapshot();
  });

  test('ignores change when disabled', async () => {
    const handleChange = jest.fn();
    const { getByRole, user } = mount(
      <Input.Checkbox disabled onChange={handleChange} />
    );

    const checkbox = getByRole('checkbox');
    await user.click(checkbox);
    expect(handleChange).not.toHaveBeenCalled();
  });

  test('ignores change when readOnly', async () => {
    const handleChange = jest.fn();
    const { getByRole, user } = mount(
      <Input.Checkbox isReadOnly onChange={handleChange} />
    );
    const checkbox = getByRole('checkbox');
    await user.click(checkbox);
    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe('<Textarea>', () => {
  test('removes notTouched className on blur', async () => {
    const { asFragment, getByRole, user } = mount(<Textarea value="a" />);
    const textarea = getByRole('textbox');

    expect(textarea).toHaveClass(className.notTouchedInput);
    await user.click(textarea);
    textarea.blur();
    expect(textarea).not.toHaveClass(className.notTouchedInput);

    expect(asFragment()).toMatchSnapshot();
  });

  test('calls onValueChange on change', async () => {
    const handleChange = jest.fn();
    const { getByRole, user } = mount(
      <Textarea value="a" onValueChange={handleChange} />
    );
    const textarea = getByRole('textbox');

    await user.type(textarea, 'b');

    expect(handleChange).toHaveBeenLastCalledWith('ab');
  });
});

describe('<Select>', () => {
  test('removes notTouched className on blur', async () => {
    const { asFragment, getByRole, user } = mount(
      <Select defaultValue="a">
        <option />
      </Select>
    );
    const select = getByRole('combobox');

    expect(select).toHaveClass(className.notTouchedInput);
    await user.click(select);
    select.blur();
    expect(select).not.toHaveClass(className.notTouchedInput);

    expect(asFragment()).toMatchSnapshot();
  });

  test('calls onValueChange on change', async () => {
    const handleChange = jest.fn();
    const { getByRole, user } = mount(
      <Select value="" onValueChange={handleChange}>
        <option />
        <option value="a" />
      </Select>
    );
    const select = getByRole('combobox');

    await user.selectOptions(select, 'a');

    expect(handleChange).toHaveBeenLastCalledWith('a');
  });

  test('select multiple calls onValuesChange', async () => {
    const handleChange = jest.fn((values) => rerender(render(values)));
    const render = (values: RA<string>): JSX.Element => (
      <Select multiple value={values} onValuesChange={handleChange}>
        <option />
        <option value="a" />
        <option value="b" />
      </Select>
    );
    const { asFragment, getByRole, user, rerender } = mount(render([]));
    const select = getByRole('listbox');

    await user.selectOptions(select, ['a', 'b']);

    expect(handleChange).toHaveBeenNthCalledWith(1, ['a']);
    expect(handleChange).toHaveBeenLastCalledWith(['a', 'b']);

    expect(asFragment()).toMatchSnapshot();
  });
});
