import defaults from '../pulp-ui-config.json';

function getAPIEnv() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('api_env') ||
    params.get('domain') ||
    defaults.API_ENV ||
    'staging'
  );
}

function resolveAPIBasePath(apiBasePath, apiEnv) {
  if (!apiBasePath || typeof apiBasePath !== 'object') {
    return apiBasePath;
  }

  const normalizedEnv = apiEnv || defaults.API_ENV || 'staging';
  return (
    apiBasePath[normalizedEnv] ||
    apiBasePath[defaults.API_ENV] ||
    Object.values(apiBasePath)[0]
  );
}

function normalizeConfig(data) {
  const config = { ...data };

  if (config.API_BASE_PATH && typeof config.API_BASE_PATH === 'object') {
    config.API_BASE_PATHS = config.API_BASE_PATH;
    config.API_ENV = config.API_ENV || getAPIEnv();
    config.API_BASE_PATH = resolveAPIBasePath(
      config.API_BASE_PATHS,
      config.API_ENV,
    );
  }

  return config;
}

export const configPromise = fetch('/pulp-ui-config.json')
  .then((data) =>
    data.status > 0 && data.status < 300
      ? data.json()
      : Promise.reject(`${data.status}: ${data.statusText}`),
  )
  .then((data) => (config = normalizeConfig(data)));

export let config = null;

export const configFallback = () => (config = normalizeConfig(defaults));
