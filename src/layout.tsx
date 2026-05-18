import { t } from '@lingui/core/macro';
import {
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  Page,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
} from '@patternfly/react-core';
import {
  DropdownItem,
  DropdownSeparator,
} from '@patternfly/react-core/deprecated';
import BarsIcon from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import QuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/question-circle-icon';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router';
import {
  DarkmodeSwitcher,
  ExternalLink,
  LanguageSwitcher,
  LoginLink,
  PulpAboutModal,
  SmallLogo,
  StatefulDropdown,
} from 'src/components';
import { config } from 'src/ui-config';
import { PulpMenu } from './menu';
import { Paths, formatPath } from './paths';
import { useUserContext } from './user-context';

const DocsDropdown = ({ showAbout }: { showAbout: () => void }) => (
  <StatefulDropdown
    ariaLabel={t`Docs dropdown`}
    data-cy='docs-dropdown'
    defaultText={<QuestionCircleIcon />}
    items={[
      <DropdownItem
        key='documentation'
        component={
          <ExternalLink
            href='https://docs.pulpproject.org/'
            variant='menu'
          >{t`Documentation`}</ExternalLink>
        }
      />,
      <DropdownItem key='about' onClick={() => showAbout()}>
        {t`About`}
      </DropdownItem>,
    ]}
    toggleType='icon'
  />
);

const EnvDropdown = ({
  currentEnv,
  onSelect,
}: {
  currentEnv: string;
  onSelect: (env: string) => void;
}) => (
  <StatefulDropdown
    ariaLabel={t`Environment selector`}
    data-cy='env-dropdown'
    defaultText={currentEnv}
    items={Object.keys(config.API_BASE_PATHS || {}).map((env) => (
      <DropdownItem key={env} value={env}>
        {env}
      </DropdownItem>
    ))}
    onSelect={(event) => onSelect(event.currentTarget.value)}
    toggleType='dropdown'
    isPlain={false}
  />
);

const UserDropdown = ({
  username,
  logout,
}: {
  username: string;
  logout: () => void;
}) => (
  <StatefulDropdown
    ariaLabel={t`User dropdown`}
    data-cy='user-dropdown'
    defaultText={username}
    items={[
      <DropdownItem isDisabled key='username'>
        {t`Username: ${username}`}
      </DropdownItem>,
      <DropdownSeparator key='separator' />,
      <DropdownItem
        key='profile'
        component={
          <Link to={formatPath(Paths.core.user.profile)}>{t`My profile`}</Link>
        }
      />,
      <DropdownItem key='logout' aria-label={'logout'} onClick={() => logout()}>
        {t`Logout`}
      </DropdownItem>,
    ]}
    toggleType='dropdown'
  />
);

export const Layout = ({ children }: { children: ReactNode }) => {
  const [aboutModalVisible, setAboutModalVisible] = useState<boolean>(false);
  const [currentEnv, setCurrentEnv] = useState<string>(config.API_ENV || 'staging');
  const { credentials, clearCredentials } = useUserContext();

  const username = credentials?.username;

  const Header = (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton>
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Link to={formatPath(Paths.core.status)}>
            <SmallLogo alt='Pulp UI' />
          </Link>
          <span
            style={{
              padding: '9px 0 0 4px',
            }}
          >
            Pulp UI
          </span>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <span style={{ flexGrow: 1 }} />
        <DarkmodeSwitcher />
        <LanguageSwitcher />
        {config.API_BASE_PATHS ? (
          <EnvDropdown
            currentEnv={currentEnv}
            onSelect={(env) => {
              if (env !== currentEnv) {
                const apiBasePaths = config.API_BASE_PATHS || {};
                if (apiBasePaths[env]) {
                  config.API_ENV = env;
                  config.API_BASE_PATH = apiBasePaths[env];
                  const params = new URLSearchParams(window.location.search);
                  params.set('api_env', env);
                  const newUrl =
                    window.location.pathname +
                    (params.toString() ? `?${params.toString()}` : '');
                  window.history.replaceState(null, '', newUrl);
                  setCurrentEnv(env);
                }
              }
            }}
          />
        ) : null}
        <DocsDropdown showAbout={() => setAboutModalVisible(true)} />
        {credentials ? (
          <UserDropdown username={username} logout={() => clearCredentials()} />
        ) : null}
        {!credentials ? <LoginLink /> : null}
      </MastheadContent>
    </Masthead>
  );

  const Sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <PulpMenu />
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page isManagedSidebar header={Header} sidebar={Sidebar}>
      {children}
      {aboutModalVisible ? (
        <PulpAboutModal
          isOpen
          onClose={() => setAboutModalVisible(false)}
          username={username}
        />
      ) : null}
    </Page>
  );
};
