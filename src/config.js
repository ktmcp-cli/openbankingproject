import Conf from 'conf';

const config = new Conf({
  projectName: 'ktmcp-openbankingproject',
  schema: {
    accessToken: {
      type: 'string',
      default: ''
    },
    baseUrl: {
      type: 'string',
      default: 'https://api.dev.openbankingproject.ch'
    }
  }
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function getAllConfig() {
  return config.store;
}

export function clearConfig() {
  config.clear();
}

export function isConfigured() {
  return !!config.get('accessToken');
}

export default config;
