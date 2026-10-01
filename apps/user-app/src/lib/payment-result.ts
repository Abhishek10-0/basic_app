import {create} from 'zustand';
export const usePaymentResult=create<{receipt:null|{reference:string;kind:'event'|'membership'};setReceipt:(receipt:{reference:string;kind:'event'|'membership'})=>void;clear:()=>void}>(set=>({receipt:null,setReceipt:receipt=>set({receipt}),clear:()=>set({receipt:null})}));
