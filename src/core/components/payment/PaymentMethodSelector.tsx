/**
 * PaymentMethodSelector Component
 * Allows user to choose between credit card and Pix payment methods
 */

'use client';

import { useState } from 'react';
import { CreditCard, Zap } from 'lucide-react';

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: 'CREDIT_CARD' | 'PIX') => void;
  selectedMethod: 'CREDIT_CARD' | 'PIX' | null;
  isLoading?: boolean;
  cardInstallments?: number;
}

export default function PaymentMethodSelector({
  onMethodSelect,
  selectedMethod,
  isLoading = false,
  cardInstallments = 12,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Escolha a forma de pagamento
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cartão de Crédito */}
        <button
          onClick={() => onMethodSelect('CREDIT_CARD')}
          disabled={isLoading}
          className={`p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${
            selectedMethod === 'CREDIT_CARD'
              ? 'border-[var(--color-primary)] bg-[var(--color-bg-secondary)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <CreditCard className="w-6 h-6 text-[var(--color-primary)]" />
          <div className="text-left">
            <p className="font-semibold text-[var(--color-text-primary)]">
              Cartão de Crédito
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {cardInstallments === 1 ? 'Cartão à vista' : `Parcelado em até ${cardInstallments}x`}
            </p>
          </div>
        </button>

        {/* Pix */}
        <button
          onClick={() => onMethodSelect('PIX')}
          disabled={isLoading}
          className={`p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${
            selectedMethod === 'PIX'
              ? 'border-[var(--color-primary)] bg-[var(--color-bg-secondary)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Zap className="w-6 h-6 text-[var(--color-primary)]" />
          <div className="text-left">
            <p className="font-semibold text-[var(--color-text-primary)]">
              Pix
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Instantâneo
            </p>
          </div>
        </button>
      </div>

      {selectedMethod && (
        <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {selectedMethod === 'CREDIT_CARD'
              ? 'Você será redirecionado para a tela de pagamento com cartão'
              : 'Você receberá um QR Code Pix para escanear'}
          </p>
        </div>
      )}
    </div>
  );
}
