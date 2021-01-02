# REACT conversion

* use controlled components for forms and inputs
* set displayName on all components
* inspect the app to make sure there are no unexpected re renders happening (maybe cause of contexts)
* use portals for modal windows (maybe also for open lists?)

## TODO:

* add constructor into my classes and make their properties readonly (also implement reduxers)
* add comment to all files at the very top (before use strict)
* rename modules to camelCase and files to lowercase

### After done

* remove unused css and js
* remove display:none

## Modal with portals

```tsx
const modalRoot = document.querySelector("#modal-root") as HTMLElement;

const Modal :React.FC<{}> = ({children}) => {
	const el = useRef(document.createElement("div"));

	useEffect(() => {
		// We assume `modalRoot` exists with '!'
		modalRoot!.appendChild(el.current);
		return () => void modalRoot!.removeChild(el.current);
	}, []);

	return createPortal(children, el.current);
};

export default Modal;

usage: const [showModal, setShowModal] = React.useState(false);
```

## Custom Hook

```tsx
export function useCount(serviceSubject) {
	const [count, setCount] = useState();

	useEffect(() => {
		serviceSubject.subscribe((count) => {
			setCount(count);
		});
		return () => {
			serviceSubject.unsubscribe();
		};
	}, [serviceSubject]);

	return [count, setCount];
}

export function ShowCount(props) {
	const [count, setCount] = useCount(props.serviceSubject);

	useEffect(() => {
		setCount(-1);
	}, [setCount]);

	return (
		<div>
			<h1> Count : {count} </h1>
		</div>
	);
}
```