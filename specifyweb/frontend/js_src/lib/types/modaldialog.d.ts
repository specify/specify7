//Modal Dialog
interface ModalDialogProps {
	readonly onLoadCallback?: (dialog: JQuery<HTMLElement>) => void,
	readonly onCloseCallback?: () => void
	readonly children?: react_elements
	readonly properties?: {[key: string]: any},
	readonly eventListenersEffect?: (dialog_ref: HTMLElement) => () => (void | (() => void))
}