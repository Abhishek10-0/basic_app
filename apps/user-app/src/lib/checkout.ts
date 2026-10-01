import {Platform} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
let popup:Window|null=null;
export function prepareCheckoutWindow(){if(Platform.OS==='web'){popup=window.open('about:blank','sme-checkout','width=520,height=760');if(!popup)throw new Error('Allow the checkout popup in your browser, then retry.');popup.document.title='Opening secure checkout';popup.document.body.textContent='Preparing your secure payment…';}}
export function closeCheckoutWindow(){if(Platform.OS==='web'){popup?.close();popup=null;}}
export async function openCheckout(url:string){if(Platform.OS==='web'){if(!popup||popup.closed)prepareCheckoutWindow();popup!.location.href=url;return;}const returnUrl=Linking.createURL('payment-return');const checkout=new URL(url);checkout.searchParams.set('returnTo',returnUrl);await WebBrowser.openAuthSessionAsync(checkout.toString(),returnUrl);}
