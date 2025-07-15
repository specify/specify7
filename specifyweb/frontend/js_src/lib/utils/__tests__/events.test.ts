import { eventListener, listen } from '../events';

test('eventListener', () => {
  const eventTarget = eventListener<{ readonly someEvent: 'abc' }>();
  const callback = jest.fn();
  const destructor = eventTarget.on('someEvent', callback);
  expect(callback).not.toHaveBeenCalled();
  eventTarget.trigger('someEvent', 'abc');
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenLastCalledWith('abc');
  destructor();
  eventTarget.trigger('someEvent', 'abc');
  expect(callback).toHaveBeenCalledTimes(1);
});

test('eventListener with immediate callback', () => {
  const eventTarget = eventListener<{ readonly someEvent: 'abc' }>();
  const callback = jest.fn();
  eventTarget.on('someEvent', callback, true);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(undefined);
});

test('listen', () => {
  const element = new EventTarget();
  const callback = jest.fn();
  const destructor = listen(element, 'click', callback);
  expect(callback).not.toHaveBeenCalled();
  element.dispatchEvent(new MouseEvent('click'));
  expect(callback).toHaveBeenCalledTimes(1);
  destructor();
  element.dispatchEvent(new MouseEvent('click'));
  expect(callback).toHaveBeenCalledTimes(1);
});
