import {pick,request,setToken} from './apiClient.js';import {user,wait} from '../mocks/data.js';
let signedIn=true;
const mock={async getCurrentUser(){await wait(100);return signedIn?{...user}:null;},async signIn(){await wait(150);signedIn=true;return {...user};},async signOut(){await wait(100);signedIn=false;setToken(null);return {ok:true};}};
const real={getCurrentUser:()=>request('/auth/me'),signIn:p=>request('/auth/sign-in',{method:'POST',body:p}),signOut:()=>request('/auth/sign-out',{method:'POST'})};
export default pick(mock,real);
