"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "Prénom requis (min 2 caractères)"),
    lastName: z.string().min(2, "Nom requis (min 2 caractères)"),
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(8, "Mot de passe trop court (min 8 caractères)")
      .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
      .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, "Vous devez accepter les conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erreur lors de l'inscription");
        return;
      }

      toast.success("Compte créé ! Vérifiez votre email.");
      router.push(`/verification-email?email=${encodeURIComponent(data.email)}`);
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = "/api/auth/google?action=register";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="shadow-violet-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl mx-auto mb-md flex items-center justify-center">
            <span className="text-on-primary text-xl font-bold">OC</span>
          </div>
          <CardTitle className="text-[24px]">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez 12 000+ candidats qui préparent leur TCF
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
            {/* Google SSO */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-sm py-sm px-md rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors font-label-md text-label-md text-on-surface"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="px-md font-label-sm text-label-sm text-on-surface-variant">ou</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-sm">
              <Input
                label="Prénom"
                placeholder="Marie"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Nom"
                placeholder="Dupont"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>

            {/* Email */}
            <Input
              label="Adresse email"
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              leftIcon={<span className="material-symbols-outlined text-[20px]">mail</span>}
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password */}
            <Input
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 caractères"
              autoComplete="new-password"
              leftIcon={<span className="material-symbols-outlined text-[20px]">lock</span>}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              }
              error={errors.password?.message}
              hint="Min. 8 caractères, 1 majuscule, 1 chiffre"
              {...register("password")}
            />

            {/* Confirm Password */}
            <Input
              label="Confirmer le mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="Répétez votre mot de passe"
              autoComplete="new-password"
              leftIcon={<span className="material-symbols-outlined text-[20px]">lock</span>}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {/* Terms */}
            <div>
              <div className="flex items-start gap-sm">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setValue("acceptTerms", checked as boolean, { shouldValidate: true })
                  }
                />
                <label htmlFor="acceptTerms" className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer leading-relaxed">
                  J&apos;accepte les{" "}
                  <Link href="/conditions" className="text-primary hover:underline">conditions d&apos;utilisation</Link>{" "}
                  et la{" "}
                  <Link href="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="mt-1 font-label-sm text-label-sm text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" loading={isLoading}>
              Créer mon compte gratuitement
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Button>
          </form>

          <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-lg">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-primary font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
