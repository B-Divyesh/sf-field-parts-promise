import {
  BrowserCacheLocation,
  PublicClientApplication,
  type AccountInfo
} from '@azure/msal-browser';

const tenantId = '35c6fe40-0ec0-46b6-98c6-213ad4de6650';
const tenantSubdomain = 'sociobotcustomers';
const clientId = '25c704f4-465a-47af-80ab-2c489466b697';
const scopes = ['openid', 'profile', 'email'];

let client: PublicClientApplication | undefined;

function e2eToken(): string {
  if (import.meta.env.VITE_E2E_AUTH !== '1') return '';
  return sessionStorage.getItem('parts-promise-e2e-token') ?? '';
}

async function msal(): Promise<PublicClientApplication> {
  if (client) return client;
  client = new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://${tenantSubdomain}.ciamlogin.com/${tenantId}/`,
      redirectUri: `${window.location.origin}/auth/callback`,
      postLogoutRedirectUri: window.location.origin
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage
    }
  });
  await client.initialize();
  return client;
}

function selectedAccount(
  instance: PublicClientApplication
): AccountInfo | null {
  return instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
}

export async function restoreCiamSession(): Promise<{
  account: AccountInfo | null;
  token: string;
}> {
  const testToken = e2eToken();
  if (testToken)
    return {
      account: {
        name: 'Playwright account',
        username: 'playwright@example.test'
      } as AccountInfo,
      token: testToken
    };
  const instance = await msal();
  const result = await instance.handleRedirectPromise();
  if (result?.account) instance.setActiveAccount(result.account);
  const account = result?.account ?? selectedAccount(instance);
  if (!account) return { account: null, token: '' };
  instance.setActiveAccount(account);
  if (result?.idToken) return { account, token: result.idToken };
  const silent = await instance.acquireTokenSilent({ account, scopes });
  return { account, token: silent.idToken };
}

export async function currentCiamToken(): Promise<string> {
  const testToken = e2eToken();
  if (testToken) return testToken;
  const instance = await msal();
  const account = selectedAccount(instance);
  if (!account) return '';
  const result = await instance.acquireTokenSilent({ account, scopes });
  return result.idToken;
}

export async function signInWithCiam(): Promise<void> {
  const instance = await msal();
  await instance.loginRedirect({ scopes, redirectStartPage: '/onboarding' });
}

export async function signOutFromCiam(): Promise<void> {
  if (e2eToken()) {
    sessionStorage.removeItem('parts-promise-e2e-token');
    window.location.assign('/');
    return;
  }
  const instance = await msal();
  const account = selectedAccount(instance);
  await instance.logoutRedirect({
    account,
    postLogoutRedirectUri: window.location.origin
  });
}
