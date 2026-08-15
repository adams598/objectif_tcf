import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Aide & Support" };

export default function AidePage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md font-bold text-on-surface mb-xs">
          Centre d&apos;aide
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Trouvez des réponses aux questions fréquentes ou contactez notre équipe.
        </p>
      </div>

      <section className="bg-surface border border-outline-variant rounded-2xl p-lg">
        <h2 className="font-headline-lg text-[18px] font-bold mb-md">Questions fréquentes</h2>
        <div className="space-y-md">
          {[
            {
              q: "Comment accéder aux séries payantes ?",
              a: "Souscrivez à un abonnement TCF, TEF ou IELTS depuis la page Offres. Seul un abonnement payant actif donne accès aux séries premium, pour la durée de l'offre choisie. Une série gratuite reste disponible pour chaque examen.",
            },
            {
              q: "Puis-je annuler mon abonnement ?",
              a: "Oui. Votre accès reste actif jusqu'à la fin de la période déjà payée. Il n'y a pas de renouvellement automatique. Aucun remboursement n'est possible après paiement.",
            },
            {
              q: "Où télécharger mes factures ?",
              a: "Dans Paramètres, section « Mes factures », après chaque paiement réussi.",
            },
            {
              q: "Comment obtenir une correction humaine ?",
              a: "Lors d'un examen d'expression orale, choisissez « Correction humaine » avant de commencer.",
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-outline-variant/50 pb-md last:border-0">
              <p className="font-label-md text-label-md font-semibold text-on-surface mb-xs">
                {item.q}
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-outline-variant rounded-2xl p-lg">
        <h2 className="font-headline-lg text-[18px] font-bold mb-md">Liens utiles</h2>
        <ul className="space-y-sm font-body-md text-body-md">
          <li>
            <Link href="/tarifs" className="text-primary hover:underline">
              Voir les tarifs et offres
            </Link>
          </li>
          <li>
            <Link href="/confidentialite" className="text-primary hover:underline">
              Politique de confidentialité
            </Link>
          </li>
          <li>
            <Link href="/remboursement" className="text-primary hover:underline">
              Conditions de remboursement
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-primary hover:underline">
              Nous contacter
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
