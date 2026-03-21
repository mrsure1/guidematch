import type { Locale } from "@/lib/i18n/config";
import commonEn from "@/messages/en/common.json";
import landingEn from "@/messages/en/landing.json";
import authEn from "@/messages/en/auth.json";
import aboutEn from "@/messages/en/about.json";
import checkoutEn from "@/messages/en/checkout.json";
import commonKo from "@/messages/ko/common.json";
import landingKo from "@/messages/ko/landing.json";
import authKo from "@/messages/ko/auth.json";
import aboutKo from "@/messages/ko/about.json";
const checkoutKo = {
  title: "\uc548\uc804\ud55c \uacb0\uc81c",
  description: "\uc5ec\ud589\uc790 \uc815\ubcf4\uc640 \uacb0\uc81c \uc218\ub2e8\uc744 \ud655\uc778\ud558\uace0 \uc608\uc57d\uc744 \ud655\uc815\ud558\uc138\uc694.",
  backToBookings: "\uc608\uc57d \ub0b4\uc5ed\uc73c\ub85c \ub3cc\uc544\uac00\uae30",
  reservationInfo: {
    title: "\uc608\uc57d\uc790 \uc815\ubcf4",
    name: "\uc774\ub984",
    namePlaceholder: "\uc774\ub984\uc744 \uc785\ub825\ud558\uc138\uc694",
    email: "\uc774\uba54\uc77c",
    emailPlaceholder: "\uc774\uba54\uc77c\uc744 \uc785\ub825\ud558\uc138\uc694",
    messageToGuide: "\uac00\uc774\ub4dc\uc5d0\uac8c \ubcf4\ub0bc \uba54\uc2dc\uc9c0",
    messagePlaceholder: "\uac00\uc774\ub4dc\uc5d0\uac8c \uc804\ub2ec\ud560 \uc6a4\uccad\uc0ac\ud56d\uc774 \uc748\uc73c\uba74 \uc801\uc5b4\uc8fc\uc138\uc694",
  },
  paymentMethod: {
    title: "\uacb0\uc81c \uc218\ub2e8",
    toss: "\ud1a0\uc2a4\ud3e8\uc774",
    kakao: "\uce74\uce74\uc624\ud3e8\uc774",
    paypal: "PayPal",
    amountUsd: "\uacb0\uc81c \uae08\uc561 (USD)",
    usdNotice: "\uc548\ub0b4: \ud658\uc0b0 \uae08\uc561\uc740 \ucc38\uace0\uc6a9\uc785\ub2c8\ub2e4.",
    loading: "\uc704\uc82f \ub85c\ub529 \uc911",
    preparing: "\uc900\ube44 \uc911...",
    payButton: "{method}\ub85c {amount} \uacb0\uc81c\ud558\uae30",
  },
  summary: {
    guideLabel: "\uac00\uc774\ub4dc",
    durationUnit: "\uc2dc\uac04",
    bookingNumber: "\uc608\uc57d\ubc88\ud638",
    guests: "\uc774\uc6a9 \uc778\uc6d0",
    guestsUnit: "\uba85",
    totalAmount: "\ucd1d \uacb0\uc81c \uae08\uc561",
    cancellationPolicy: {
      title: "\ucde8\uc18c \uaddc\uc815",
      threeDays: "\ud22c\uc5b4 \uc77c\uc815 3\uc77c \uc804\uae4c\uc9c0: \uc804\uc561 \ud658\ubd88",
      twoDays: "\ud22c\uc5b4 \uc77c\uc815 2\uc77c \uc804 ~ \ub2e4\uc77c: \ud658\ubd88 \ubd88\uac00",
      guideCircumstance: "\uac00\uc774\ub4dc \uc0ac\uc815\uc73c\ub85c \ucde8\uc18c \uc2dc\uc5d0\ub294 \uc608\uc678 \uc5c6\uc774 \uc804\uc561 \ud658\ubd88\ub429\ub2c8\ub2e4.",
    },
  },
  alerts: {
    paymentError: "\uacb0\uc81c \uc624\ub958",
    paymentCancel: "\uacb0\uc81c\uac00 \ucde8\uc18c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.",
    paymentCancelDetail: "\uacb0\uc81c\uac00 \ucde8\uc18c\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \ub2e4\ub978 \uacb0\uc81c \uc218\ub2e8\uc744 \uc120\ud0dd\ud558\uac70\ub098 \uc774\uc804 \ub2e8\uacc4\ub85c \ub3cc\uc544\uac08 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
    invalidCard: "\uc120\ud0dd\ud55c \uacb0\uc81c \uc218\ub2e8 \uc815\ubcf4\uac00 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.",
    processCancelled: "\uacb0\uc81c \uc9c4\ud589\uc774 \uc911\ub2e8\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \uc785\ub825\ud55c \uc815\ubcf4\ub974\ub97c \ub2e4\uc2dc \ud655\uc778\ud55c \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.",
    internalError: "\uacb0\uc81c \ucc98\ub9ac \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud558\uc600\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.",
    failGeneric: "\uacb0\uc81c\ub97c \uc644\ub8cc\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc785\ub825 \uc815\ubcf4\uc640 \uc57d\uad00 \ub3d9\uc758\ub97c \ub2e4\uc2dc \ud655\uc778\ud574\uc8fc\uc138\uc694.",
    paymentSuccess: "\uacb0\uc81c \uc131\uacf5",
    paymentSuccessDetail: "\uacb0\uc81c\uac00 \uc131\uacf5\uc801\uc73c\ub85c \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4.",
    widgetNotReady: "\uacb0\uc81c \uc704\uc82f\uc774 \uc544\uc9c1 \uc900\ube44\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.",
    dataLoadFailed: "\uc608\uc57d \ub370\uc774\ud130 \uc870\ud68c \uc2e4\ud328",
  },
  popup: {
    back: "\ub424\ub85c\uac00\uae30",
    close: "\ub2eb\uae30",
    windowTitle: "GuideMatch \uacb0\uc81c\ucc3d",
  },
};

const dictionaries = {
  en: {
    common: commonEn,
    landing: landingEn,
    auth: authEn,
    about: aboutEn,
    checkout: checkoutEn,
  },
  ko: {
    common: commonKo,
    landing: landingKo,
    auth: authKo,
    about: aboutKo,
    checkout: checkoutKo,
  },
} as const;

export type Dictionary = (typeof dictionaries)["en"];

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale] ?? dictionaries.en;
}
