import {useEffect,useRef} from 'react';
import {usePaymentResult} from '../lib/payment-result';
import {closeCheckoutWindow} from '../lib/checkout';
import { Text } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button, styles } from "./ui";
export function PaymentProgress({
  statusUrl,
  kind,
}: {
  statusUrl: string;
  kind: "event" | "membership";
}) {
  const q = useQuery({
    queryKey: ["checkout-status", statusUrl],
    queryFn: () => api<{ status: string; reference: string }>(statusUrl),
    refetchInterval: (query) =>
      ["PAID", "FAILED", "REFUNDED"].includes(query.state.data?.status ?? "")
        ? false
        : 4000,
    retry: false,
  });
  const paid = q.data?.status === "PAID";
  const client=useQueryClient();const handled=useRef(false);const setReceipt=usePaymentResult(s=>s.setReceipt);
  useEffect(()=>{if(!paid||handled.current)return;handled.current=true;closeCheckoutWindow();setReceipt({kind,reference:q.data?.reference??''});for(const key of ['my-membership','my-bookings','payment-history'])void client.invalidateQueries({queryKey:[key]});router.replace('/profile');},[paid,q.data?.reference,kind,client,setReceipt]);
  return (
    <>
      <Text style={styles.heading}>
        {paid ? "Payment verified" : "Waiting for payment confirmation"}
      </Text>
      <Text style={styles.text}>
        {paid
          ? `Your ${kind === "event" ? "event booking" : "membership"} is confirmed. Reference: ${q.data?.reference}`
          : "Complete payment in the checkout window, then return here. The server checks capture before confirming your purchase."}
      </Text>
      {q.isError && <Text style={styles.error}>{q.error.message}</Text>}
      <Button secondary onPress={() => void q.refetch()}>
        Check status
      </Button>
      <Button
        onPress={() =>
          router.replace("/profile")
        }
      >
        Go to profile
      </Button>
    </>
  );
}
