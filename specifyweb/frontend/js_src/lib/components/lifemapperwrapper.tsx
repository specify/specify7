import $ from 'jquery';
import React from 'react';
import { SN_SERVICES } from '../lifemapperconfig';
import { formatLifemapperViewPageRequest } from '../lifemapperutills';
import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import { Badge } from './lifemappercomponents';
import { Lifemapper } from './lifemapper';
import createBackboneView from './reactbackboneextend';

interface Props {
  model: any;
}

export interface ComponentProps extends Props {
  readonly guid: string;
}

class ErrorBoundary extends React.Component<
  { readonly children: JSX.Element; readonly hasErrorCallback: () => void },
  { readonly hasError: boolean }
> {
  public state: { readonly hasError: boolean } = {
    hasError: false,
  };

  public componentDidCatch = this.props.hasErrorCallback;

  public render(): JSX.Element | null {
    return this.props.children;
  }
}

// If any error occurs, fallback to displaying a link to the SN page
function LifemapperWrapper(props: ComponentProps): JSX.Element {
  const [hasError, setHasError] = React.useState<boolean>(false);
  const [occurrenceName, setOccurrenceName] = React.useState<
    string | undefined
  >(undefined);

  return hasError ? (
    typeof occurrenceName === 'undefined' ? (
      <></>
    ) : (
      <Badge
        name={'sn'}
        title={SN_SERVICES.sn}
        onClick={(): void =>
          void window.open(
            formatLifemapperViewPageRequest(props.guid, occurrenceName, ''),
            '_blank'
          )
        }
        isEnabled={true}
        hasError={false}
      />
    )
  ) : (
    <ErrorBoundary hasErrorCallback={() => setHasError(true)}>
      <Lifemapper
        {...props}
        handleOccurrenceNameFetch={setOccurrenceName}
      />
    </ErrorBoundary>
  );
}

const View = createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'Lifemapper',
  className: 'lifemapper-info',
  initialize(self, { model }) {
    self.model = model;
  },
  renderPre(self) {
    self.el.style.display = '';
  },
  remove(self) {
    self.el.style.display = 'none';
  },
  silentErrors: true,
  Component: LifemapperWrapper,
  getComponentProps: (self) => ({
    model: self.model,
    guid: self.model.get('guid'),
  }),
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    if (
      resourceView.model.specifyModel.name === 'CollectionObject' &&
      // @ts-expect-error
      remotePrefs['s2n.badges.disable'] !== 'true'
    )
      // @ts-expect-error
      new View({
        model: resourceView.model,
        el: $(
          '<span class="lifemapper-info" style="display:none;"></span>'
        ).appendTo(resourceView.header),
      }).render();
  });
}
