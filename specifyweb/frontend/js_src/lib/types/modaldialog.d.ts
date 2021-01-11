//Modal Dialog

interface ModalDialogBaseProps {
	readonly children: react_elements,
}

interface ModalDialogContentProps extends ModalDialogBaseProps {
	readonly onLoadCallback?: () => void | (() => void),
}

interface ModalDialogProps extends ModalDialogBaseProps {
	readonly onLoadCallback?: (dialog: JQuery<HTMLElement>) => void|(()=>void),
	readonly onCloseCallback?: () => void
	readonly properties?: Readonly<Record<string,unknown>>,
}