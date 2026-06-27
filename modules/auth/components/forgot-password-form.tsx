"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, action: "request" }),
      });

      if (response.ok) {
        setSentEmail(data.email);
        setSent(true);
      } else {
        const result = await response.json();
        toast.error(result.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="shadow-violet-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl mx-auto mb-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-primary">
              {sent ? "mark_email_read" : "lock_reset"}
            </span>
          </div>
          <CardTitle className="text-[24px]">
            {sent ? "Email envoyé !" : "Mot de passe oublié ?"}
          </CardTitle>
          <CardDescription>
            {sent
              ? `Un lien de réinitialisation a été envoyé à ${sentEmail}`
              : "Entrez votre email pour recevoir un lien de réinitialisation."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-md"
              >
                <Input
                  label="Adresse email"
                  type="email"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  leftIcon={<span className="material-symbols-outlined text-[20px]">mail</span>}
                  error={errors.email?.message}
                  {...register("email")}
                />

                <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                  Envoyer le lien
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-md text-center"
              >
                <div className="bg-success-container rounded-xl p-md">
                  <p className="font-body-md text-body-md text-success">
                    Vérifiez votre boîte de réception et vos spams.
                    Le lien est valide pendant 1 heure.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setSent(false)}
                >
                  Renvoyer l&apos;email
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-lg">
            <Link href="/connexion" className="text-primary font-semibold hover:underline flex items-center justify-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Retour à la connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
