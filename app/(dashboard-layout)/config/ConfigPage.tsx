"use client";

import { Suspense } from "react";
import { useConfigDeepLink } from "@/app/hooks/useConfigDeepLink";
import RatesSection from "./RatesSection";
import styles from "./page.module.css";

function ConfigDeepLinkHandler() {
  useConfigDeepLink();
  return null;
}

const ConfigPage = () => {
  return (
    <div className={styles.page}>
      <Suspense fallback={null}>
        <ConfigDeepLinkHandler />
      </Suspense>

      <header className={styles.page__header}>
        <h1 className={styles.page__title}>CONFIGURACIÓN</h1>
      </header>

      <main className={styles.page__content}>
        <section
          id="config-section-rates"
          className={styles.page__section}
          aria-labelledby="rates-heading"
        >
          <h2 id="rates-heading" className={styles.page__sectionTitle}>
            TASAS
          </h2>
          <RatesSection />
        </section>

        <section
          id="config-section-categories"
          className={styles.page__section}
          aria-labelledby="categories-heading"
        >
          <h2 id="categories-heading" className={styles.page__sectionTitle}>
            CATEGORÍAS
          </h2>
          {/* DEV-18/DEV-22 will populate this section */}
        </section>

        <section
          id="config-section-payment-methods"
          className={styles.page__section}
          aria-labelledby="payment-methods-heading"
        >
          <h2
            id="payment-methods-heading"
            className={styles.page__sectionTitle}
          >
            MÉTODOS DE PAGO
          </h2>
          {/* DEV-18/DEV-21 will populate this section */}
        </section>

        <section
          id="config-section-preferences"
          className={styles.page__section}
          aria-labelledby="preferences-heading"
        >
          <h2 id="preferences-heading" className={styles.page__sectionTitle}>
            PREFERENCIAS
          </h2>
          {/* DEV-18/DEV-25 will populate this section */}
        </section>
      </main>
    </div>
  );
};

export default ConfigPage;
