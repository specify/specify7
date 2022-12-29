import { IR, RA } from '../../utils/types';

const defineObject = <SPEC extends IR<EditorSpec>>(spec: SPEC): SPEC => spec;

const defineArray = <SPEC extends RA<EditorSpec>>(spec: SPEC): SPEC => spec;

type EditorSpec = IR<EditorSpec> | RA<EditorSpec>;

export function VisualEditor({
  xml,
  definition,
}: {
  readonly xml: Element;
  readonly spec: EditorSpec;
}): JSX.Element {}

type DataObjFormatterSpec = {};
