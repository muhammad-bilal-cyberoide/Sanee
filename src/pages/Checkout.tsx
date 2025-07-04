import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function Checkout() {
  const { t } = useTranslation();
  const { gig_uid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const proposalPrice = location.state?.price;
  const jobId = location.state?.job_id;
  const jobTitle = location.state?.job_title;
  const isCustomOrder = location.state?.is_custom_order;
  const orderId = location.state?.order_id || location.state?.chat_order_id;

  const [gig, setGig] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [message, setMessage] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchGigAndBuyer();
  }, []);

  const fetchGigAndBuyer = async () => {
    try {
      const token = localStorage.getItem("token");

      const gigRes = await axios.get(`${config.API_BASE_URL}/gigs/by-uid/${gig_uid}`);
      const buyerRes = await axios.get(`${config.API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGig(gigRes.data);
      setBuyer(buyerRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");

      const contractRes = await axios.post(
        `${config.API_BASE_URL}/contracts`,
        {
          gig_id: gig.id,
          buyer_id: buyer.id,
          seller_id: gig.user_id,
          price: proposalPrice || gig.price,
          status: "pending",
          is_custom_order: isCustomOrder || false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const contractId = contractRes.data.id;

      await axios.post(
        `${config.API_BASE_URL}/payments`,
        {
          contract_id: contractId,
          order_id: orderId,
          method: "bank_transfer",
          status: "pending",
          payment_note: message,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t("checkout.order_success"));
      navigate("/contracts");
    } catch (err) {
      console.error("Checkout failed", err);
      toast.error(t("checkout.order_error"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return <p className="text-center py-10 text-red-600">{t("checkout.loading")}</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-red-700 mb-6">{t("checkout.title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-gray-700">
              {isCustomOrder ? t("checkout.custom_order_details") : t("checkout.gig_details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-800">
            <p className="font-semibold text-lg">{gig.title}</p>
            <p>{gig.description}</p>
            <p><strong>{t("checkout.price")}:</strong> ${proposalPrice || gig.price}</p>
            <p><strong>{t("checkout.delivery")}:</strong> {gig.delivery_time} {t("checkout.days")}</p>

            {jobId && (
              <div>
                <p><strong>{t("checkout.job_id")}:</strong> {jobId}</p>
                <p><strong>{t("checkout.job_title")}:</strong> {jobTitle}</p>
              </div>
            )}

            {isCustomOrder && (
              <div className="p-3 rounded bg-red-100 text-sm border border-red-300">
                <strong>{t("checkout.custom_order")}:</strong>
                <p>{t("checkout.custom_order_note")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-gray-700">{t("checkout.your_info")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-gray-800">
              <p><strong>{t("checkout.name")}:</strong> {buyer.first_name} {buyer.last_name}</p>
              <p><strong>{t("checkout.email")}:</strong> {buyer.email}</p>
              <Textarea
                rows={3}
                className="border border-gray-400 text-gray-800 placeholder:text-red-300"
                placeholder={t("checkout.message_placeholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-gray-700">{t("checkout.payment_method")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-800">
              <p><strong>{t("checkout.method")}:</strong> {t("checkout.bank_transfer")}</p>
              <p className="text-gray-500">{t("checkout.payment_note")}</p>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handlePlaceOrder}
                disabled={processing}
              >
                {processing ? t("checkout.placing") : t("checkout.confirm")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
