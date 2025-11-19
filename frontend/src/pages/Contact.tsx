import React from 'react';
import { Icon } from '@iconify/react';
import logoArmees from '../assets/Ministère_des_Armées.svg.png';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Small Screen Blocker */}
      <div className="sm:hidden fixed inset-0 z-[9999] bg-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Écran trop petit</h1>
          <p className="text-gray-600 max-w-md">
            Ce site nécessite un écran plus grand. Veuillez utiliser un ordinateur de bureau ou une tablette.
          </p>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center gap-4">
              <img
                src={logoArmees}
                alt="Ministère des Armées"
                className="h-20 w-auto"
              />
            </div>
            <a
              href="/"
              className="px-4 py-2 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Tableau de bord
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-40 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4 mt-4">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Icon icon="mdi:contact-mail" className="w-10 h-10" />
            Contactez-nous
          </h1>
          <p className="text-muted-foreground text-lg">
            Notre équipe de support technique est disponible pour vous aider avec tout problème lié à la sécurité de votre pare-feu.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Email Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon icon="mdi:email" className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Envoyez-nous un email et nous vous répondrons dans les plus brefs délais.
                </p>
                <a
                  href="mailto:support@firewall-monitor.fr"
                  className="text-blue-600 hover:underline font-medium inline-flex items-center gap-2"
                >
                  support@firewall-monitor.fr
                  <Icon icon="mdi:arrow-right" className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Icon icon="mdi:phone" className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Téléphone
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Appelez-nous directement pour une assistance immédiate.
                </p>
                <a
                  href="tel:+33123456789"
                  className="text-green-600 hover:underline font-medium inline-flex items-center gap-2"
                >
                  +33 1 23 45 67 89
                  <Icon icon="mdi:arrow-right" className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Support Hours Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Icon icon="mdi:clock" className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Horaires de support
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Lundi - Vendredi : 9h00 - 18h00</p>
                  <p>Samedi : 10h00 - 16h00</p>
                  <p>Dimanche : Fermé</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Icon icon="mdi:alert" className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Urgences sécurité
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Pour les incidents de sécurité critiques, contactez notre ligne d'urgence 24/7.
                </p>
                <a
                  href="tel:+33987654321"
                  className="text-red-600 hover:underline font-medium inline-flex items-center gap-2"
                >
                  +33 9 87 65 43 21
                  <Icon icon="mdi:arrow-right" className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900">
                Informations importantes
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Le temps de réponse moyen par email est de 2-4 heures pendant les heures ouvrables.</li>
                <li>Pour les incidents critiques, privilégiez la ligne téléphonique d'urgence.</li>
                <li>Veuillez avoir votre ID de pare-feu à portée de main lors de votre contact.</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
