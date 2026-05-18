import { t } from '@lingui/core/macro';
import {
  Card,
  CardBody,
  CardTitle,
  Gallery,
  GalleryItem,
} from '@patternfly/react-core';
import { DropdownItem } from '@patternfly/react-core/deprecated';
import { Component } from 'react';
import { DomainAPI } from 'src/api';
import {
  AlertList,
  type AlertType,
  BaseHeader,
  EmptyStateNoData,
  LoadingSpinner,
  Main,
  StatefulDropdown,
  closeAlert,
} from 'src/components';
import { type RouteProps, jsxErrorMessage, withRouter } from 'src/utilities';

interface IState {
  alerts: AlertType[];
  domains: any[];
  loading: boolean;
  selectedDomain: any;
}

const DomainDetail = ({ domain }: { domain: any }) => (
  <Card>
    <CardTitle>{domain.name || t`Domain details`}</CardTitle>
    <CardBody>
      <p>
        <strong>{t`Name`}</strong>: {domain.name || t`-`}
      </p>
      <p>
        <strong>{t`ID`}</strong>: {domain.id || domain.pulp_id || t`-`}
      </p>
      <p>
        <strong>{t`Pulp href`}</strong>: <code>{domain.pulp_href || t`-`}</code>
      </p>
      {domain.resource_label ? (
        <p>
          <strong>{t`Resource label`}</strong>: {domain.resource_label}
        </p>
      ) : null}
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(domain, null, 2)}
      </pre>
    </CardBody>
  </Card>
);

class DomainList extends Component<RouteProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      alerts: [],
      domains: [],
      loading: true,
      selectedDomain: null,
    };
  }

  componentDidMount() {
    this.queryDomains();
  }

  render() {
    const { alerts, domains, loading, selectedDomain } = this.state;

    return (
      <>
        <AlertList
          alerts={alerts}
          closeAlert={(i) =>
            closeAlert(i, {
              alerts,
              setAlerts: (alerts) => this.setState({ alerts }),
            })
          }
        />
        <BaseHeader title={t`Domains`} />
        {!loading ? (
          <Main>
            {domains.length === 0 ? (
              <EmptyStateNoData
                title={t`No domains found`}
                description={t`There are no domains available to select.`}
              />
            ) : (
              <>
                <section className='pulp-section'>
                  <p>{t`Choose a domain from the dropdown below.`}</p>
                  <StatefulDropdown
                    ariaLabel={t`Domain selector`}
                    defaultText={t`Select domain`}
                    items={domains.map((domain) => (
                      <DropdownItem
                        key={domain.id || domain.pulp_id || domain.name}
                        value={domain.name}
                      >
                        {domain.name || domain.id || domain.pulp_id}
                      </DropdownItem>
                    ))}
                    onSelect={(event) => {
                      const selectedName = event.currentTarget.value;
                      const selectedDomain = domains.find(
                        (domain) => domain.name === selectedName,
                      );
                      this.setState({ selectedDomain });
                    }}
                    toggleType='dropdown'
                    isPlain={false}
                  />
                </section>
                <br />
                {selectedDomain ? (
                  <Gallery hasGutter>
                    <GalleryItem>
                      <DomainDetail domain={selectedDomain} />
                    </GalleryItem>
                  </Gallery>
                ) : (
                  <p>{t`Select a domain to see details here.`}</p>
                )}
              </>
            )}
          </Main>
        ) : (
          <Main>
            <LoadingSpinner />
          </Main>
        )}
      </>
    );
  }

  private queryDomains() {
    DomainAPI.list({ page_size: 100 })
      .then(({ data }) => {
        this.setState({ domains: data.results || data, loading: false });
      })
      .catch((e) => {
        const { status, statusText } = e.response || {};
        this.setState({
          loading: false,
          alerts: [
            ...this.state.alerts,
            {
              variant: 'danger',
              title: t`Failed to load domains`,
              description: jsxErrorMessage(status, statusText),
            },
          ],
        });
      });
  }
}

export default withRouter(DomainList);
