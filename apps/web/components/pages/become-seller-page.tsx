'use client';

import { useState, useRef } from 'react';
import { Check, UploadCloud, File as FileIcon, Trash2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface UploadedFile {
  name: string;
  size: string;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="6"
      viewBox="0 0 16 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.6138 1.63466L12.3205 2.34199L8.46916 6.19466C8.40745 6.25676 8.33407 6.30605 8.25323 6.33968C8.1724 6.37331 8.08571 6.39063 7.99816 6.39063C7.91061 6.39063 7.82392 6.37331 7.74309 6.33968C7.66226 6.30605 7.58887 6.25676 7.52716 6.19466L3.67383 2.34199L4.38049 1.63532L7.99716 5.25132L11.6138 1.63466Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UsFlag() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M8 1.25H1C0.948667 1.25 0.898333 1.25375 0.849 1.26125L0.848 1.69975L0.1655 1.69875C0.0575034 1.86231 -4.74053e-05 2.054 2.92989e-08 2.25V6.75C2.92989e-08 7.01522 0.105357 7.26957 0.292893 7.45711C0.48043 7.64464 0.734784 7.75 1 7.75H8C8.26522 7.75 8.51957 7.64464 8.70711 7.45711C8.89464 7.26957 9 7.01522 9 6.75V2.25C9 1.98478 8.89464 1.73043 8.70711 1.54289C8.51957 1.35536 8.26522 1.25 8 1.25Z"
        fill="#00247D"
      />
      <path
        d="M2.75 1.25H2V2.5H0V3.25H2V4.5H2.75V3.25H4.75V2.5H2.75V1.25Z"
        fill="#CF1B2B"
      />
      <path
        d="M4.75 1.25H4.16725L3 2.06725V1.25H1.75V1.89225L0.849 1.26125C0.698708 1.28368 0.555644 1.34058 0.431 1.4275L1.6065 2.25H1.1725L0.24175 1.59775C0.214226 1.62977 0.188759 1.66351 0.1655 1.69875L0.95325 2.25H0V3.5H0.97125L0 4.1915V4.5H0.833L1.75 3.858V4.5H3V3.68275L4.167 4.5H4.75V3.99275L4.04625 3.5H4.75V2.25H4.0465L4.75 1.75725V1.25Z"
        fill="#EEEEEE"
      />
      <path
        d="M4.75009 1.25H4.38484L3.00009 2.21975V2.25H3.39284L4.75009 1.2995V1.25ZM0.431094 1.4275C0.361015 1.47596 0.297417 1.53317 0.241844 1.59775L1.17259 2.25H1.60634L0.431094 1.4275ZM1.60934 3.5L0.183594 4.5H0.615344L1.75009 3.7055V3.5H1.60934ZM4.75009 4.4505V4.1455L3.82834 3.5H3.39259L4.75009 4.4505Z"
        fill="#CF1B2B"
      />
    </svg>
  );
}

function CanadaFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="9" height="6" fill="#F01C24" />
      <rect x="2.25" width="4.5" height="6" fill="#FFFFFF" />
      <path d="M4.5 1.5L4.8 2.5L5.8 2.5L5 3.2L5.3 4.2L4.5 3.6L3.7 4.2L4 3.2L3.2 2.5L4.2 2.5L4.5 1.5Z" fill="#F01C24" />
    </svg>
  );
}

function UkFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="9" height="6" fill="#00247D" />
      <path d="M0 0L9 6M9 0L0 6" stroke="#FFFFFF" strokeWidth="0.8" />
      <path d="M0 0L9 6M9 0L0 6" stroke="#CF1B2B" strokeWidth="0.4" />
      <path d="M4.5 0V6M0 3H9" stroke="#FFFFFF" strokeWidth="1.2" />
      <path d="M4.5 0V6M0 3H9" stroke="#CF1B2B" strokeWidth="0.6" />
    </svg>
  );
}

function NigeriaFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="3" height="6" fill="#008751" />
      <rect x="3" width="3" height="6" fill="#FFFFFF" />
      <rect x="6" width="3" height="6" fill="#008751" />
    </svg>
  );
}

function GermanyFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="9" height="2" fill="#000000" />
      <rect y="2" width="9" height="2" fill="#DD0000" />
      <rect y="4" width="9" height="2" fill="#FFCC00" />
    </svg>
  );
}

function FranceFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="3" height="6" fill="#00209F" />
      <rect x="3" width="3" height="6" fill="#FFFFFF" />
      <rect x="6" width="3" height="6" fill="#F6424F" />
    </svg>
  );
}

function AustraliaFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="9" height="6" fill="#000080" />
      <rect width="4.5" height="3" fill="#00247D" />
      <path d="M0 0L4.5 3M4.5 0L0 3" stroke="#FFFFFF" strokeWidth="0.4" />
      <path d="M2.25 0V3M0 1.5H4.5" stroke="#FFFFFF" strokeWidth="0.6" />
      <path d="M2.25 0V3M0 1.5H4.5" stroke="#CF1B2B" strokeWidth="0.3" />
      <circle cx="6.75" cy="1.5" r="0.3" fill="#FFFFFF" />
      <circle cx="6.75" cy="4.5" r="0.3" fill="#FFFFFF" />
      <circle cx="5.4" cy="3" r="0.3" fill="#FFFFFF" />
      <circle cx="8.1" cy="3" r="0.3" fill="#FFFFFF" />
      <circle cx="7.4" cy="3.6" r="0.15" fill="#FFFFFF" />
    </svg>
  );
}

interface CountryPhoneOption {
  code: string;
  prefix: string;
  name: string;
  FlagComponent: React.ComponentType;
}

const PHONE_PREFIX_OPTIONS: CountryPhoneOption[] = [
  { code: 'US', prefix: '+1', name: 'United States', FlagComponent: UsFlag },
  { code: 'CA', prefix: '+1', name: 'Canada', FlagComponent: CanadaFlag },
  { code: 'GB', prefix: '+44', name: 'United Kingdom', FlagComponent: UkFlag },
  { code: 'NG', prefix: '+234', name: 'Nigeria', FlagComponent: NigeriaFlag },
  { code: 'DE', prefix: '+49', name: 'Germany', FlagComponent: GermanyFlag },
  { code: 'FR', prefix: '+33', name: 'France', FlagComponent: FranceFlag },
  { code: 'AU', prefix: '+61', name: 'Australia', FlagComponent: AustraliaFlag },
];


function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.35145 14.4192C6.47295 14.4192 5.82445 14.4037 5.22745 14.3887C4.72045 14.3767 4.25045 14.3652 3.70595 14.3652C2.85139 14.3643 2.0321 14.0245 1.42779 13.4202C0.823478 12.816 0.483504 11.9968 0.482446 11.1422C0.480421 10.6177 0.607365 10.1007 0.852104 9.6368C1.09684 9.17286 1.45187 8.7762 1.88595 8.48173C1.81366 8.13 1.77731 7.77182 1.77745 7.41273C1.77745 4.49173 4.15395 2.11523 7.07545 2.11523C9.03145 2.11523 10.8229 3.19723 11.7414 4.90223C12.0407 4.59575 12.3984 4.35246 12.7934 4.18679C13.1884 4.02111 13.6126 3.93642 14.0409 3.93773C15.2264 3.93816 16.3197 4.60257 16.8699 5.65127C17.4201 6.69996 17.3407 7.96583 16.6664 8.93623C17.3237 9.11348 17.9006 9.51505 18.3009 10.0749C18.7012 10.6347 18.901 11.3183 18.866 12.0104C18.7999 13.3793 17.6988 14.4826 16.3302 14.5512C15.4892 14.594 14.6482 14.5988 13.8071 14.5652C13.7401 14.5651 13.6759 14.5383 13.6284 14.4908C13.5809 14.4433 13.5541 14.3791 13.554 14.3121C13.5539 14.2451 13.5805 14.1808 13.6279 14.1332C13.6753 14.0855 13.7394 14.0586 13.8064 14.0582C14.6393 14.0913 15.4722 14.0867 16.3051 14.0441C17.4238 13.9873 18.3163 13.095 18.3703 11.9762C18.4184 10.9995 17.8433 10.1029 16.9302 9.73523C16.8601 9.70688 16.8028 9.65358 16.7693 9.58561C16.7357 9.51764 16.7282 9.43977 16.7482 9.36673C16.9601 8.58873 16.7811 7.74923 16.2679 7.12823C15.7547 6.50723 14.9731 6.19123 14.1722 6.27123C13.3712 6.35123 12.6699 6.81923 12.3039 7.52123C12.2684 7.58973 12.207 7.64073 12.1334 7.66333C12.0598 7.68593 11.9803 7.67823 11.9124 7.64173C11.0914 7.20273 10.1349 7.06173 9.21545 7.24473C8.29595 7.42773 7.47095 7.92173 6.88895 8.64073C6.84445 8.69573 6.78195 8.73273 6.71295 8.74473C6.64395 8.75673 6.57295 8.74273 6.51345 8.70573C6.17895 8.49273 5.79745 8.37173 5.40395 8.35573C5.01045 8.33973 4.61945 8.42973 4.27095 8.61573C3.92245 8.80173 3.63145 9.07673 3.42845 9.41373C3.22545 9.75073 3.11845 10.1367 3.11895 10.5307C3.11895 10.6157 3.09895 10.9517 3.09895 11.1422C3.09881 11.6469 3.30032 12.1308 3.65847 12.4876C4.01661 12.8445 4.50146 13.0442 5.00595 13.0422C5.55195 13.0422 5.82945 13.0522 6.23795 13.0652C6.83895 13.0782 7.48395 13.0942 8.35795 13.0942C8.42438 13.0943 8.48807 13.1208 8.53501 13.1678C8.58194 13.2148 8.60826 13.2785 8.6082 13.345C8.60813 13.4114 8.58167 13.4751 8.53465 13.522C8.48762 13.569 8.42388 13.5953 8.35745 13.5952C7.48345 13.5952 6.83795 13.5792 6.23595 13.5662C5.83195 13.5532 5.55295 13.5432 5.00595 13.5432C4.37037 13.5456 3.7604 13.2928 3.3089 12.8424C2.8574 12.392 2.60344 11.7825 2.60295 11.1469C2.60295 10.9619 2.62295 10.6249 2.62295 10.5309C2.62245 10.0469 2.75695 9.57273 3.01095 9.16173C3.26495 8.75073 3.62745 8.41473 4.05895 8.19073C4.49045 7.96673 4.97495 7.86273 5.46095 7.88873C5.75145 7.90323 6.03495 7.97073 6.29995 8.08873C6.92945 7.33073 7.79895 6.81473 8.76295 6.62173C9.56995 6.45973 10.4039 6.53073 11.1679 6.82373C11.6569 6.05573 12.5099 5.57573 13.4339 5.48373C13.8369 5.44373 14.2419 5.48273 14.6279 5.59873C14.0979 4.59573 13.0249 3.94273 11.8579 3.93773C9.03195 3.93773 6.72995 6.21973 6.71195 9.04573C6.71023 9.11174 6.68278 9.17473 6.63548 9.22133C6.58817 9.26793 6.52463 9.29455 6.45845 9.29523C6.39228 9.29591 6.32821 9.27061 6.27993 9.22497C6.23165 9.17934 6.20293 9.11692 6.19995 9.05073C6.22595 6.52373 8.10995 4.39773 10.5789 3.96473C10.0819 3.27173 9.42395 2.70673 8.66295 2.31273C7.90195 1.91873 7.05895 1.70573 6.19995 1.69373C3.67345 1.69373 1.61995 3.72673 1.61995 6.23873C1.61995 6.61673 1.66445 6.99473 1.75245 7.36173C1.76456 7.41353 1.75986 7.46788 1.7391 7.51696C1.71833 7.56603 1.68261 7.60729 1.63695 7.63473C1.23395 7.87573 0.900452 8.21673 0.667952 8.62573C0.435452 9.03473 0.312452 9.49473 0.312452 9.96273C0.313378 10.6848 0.600622 11.377 1.11119 11.8876C1.62176 12.3981 2.31394 12.6853 3.03595 12.6862C3.58895 12.6862 4.25895 12.6962 4.76395 12.7092C5.35895 12.7222 5.99995 12.7382 6.87745 12.7382C6.94388 12.7383 7.00757 12.7648 7.0545 12.8118C7.10143 12.8588 7.12776 12.9225 7.1277 12.989C7.12763 13.0554 7.10117 13.1191 7.05415 13.166C7.00712 13.213 6.94338 13.2393 6.87695 13.2392C5.99595 13.2392 5.35195 13.2232 4.75395 13.2102C4.24895 13.1972 3.57895 13.1872 3.03595 13.1872C2.17936 13.1869 1.35805 12.8471 0.753423 12.2426C0.148798 11.638 -0.19139 10.8168 -0.191406 9.96023C-0.191406 9.39273 -0.0454065 8.83473 0.244594 8.34073C0.413594 8.04573 0.626594 7.78373 0.877594 7.56173C0.805594 7.21073 0.769594 6.85173 0.769594 6.49273C0.769594 4.37273 2.06159 2.55873 3.89359 1.78173C4.57259 1.49373 5.31359 1.34673 6.07059 1.34673C8.19659 1.34573 10.1196 2.46073 11.1426 4.27773C11.4556 4.01873 11.8136 3.82173 12.1956 3.69773C11.4676 2.56473 10.3756 1.70473 9.09559 1.27273C7.81559 0.840729 6.42359 0.862729 5.15759 1.33373C2.79759 2.22373 1.18359 4.55473 1.18359 7.10973C1.18359 7.47873 1.22659 7.84673 1.31059 8.20473C0.895588 8.45873 0.541588 8.80773 0.282588 9.22373C0.0235876 9.63973 -0.112412 10.1167 -0.112412 10.6017C-0.108412 12.0897 0.948588 13.3537 2.39759 13.6207C2.64559 13.6667 2.89859 13.6897 3.15359 13.6897C3.69459 13.6897 4.15559 13.6997 4.64459 13.7127C5.23659 13.7257 5.88259 13.7417 6.76659 13.7417C6.83287 13.7418 6.89637 13.7682 6.9432 13.8151C6.99004 13.862 7.01629 13.9256 7.01623 13.992C7.01616 14.0584 6.9898 14.122 6.94287 14.169C6.89594 14.216 6.8324 14.2423 6.76612 14.2423L7.35145 14.4192Z"
        fill="currentColor"
        className="text-primary"
      />
      <path
        d="M13.1751 11.2282C13.1104 11.2282 13.0482 11.2031 13.0016 11.1582L9.61309 7.89071L6.24009 11.1447C6.19229 11.1907 6.12816 11.2159 6.06182 11.2146C5.99548 11.2133 5.93236 11.1858 5.88634 11.138C5.84033 11.0902 5.81519 11.026 5.81645 10.9597C5.81772 10.8933 5.84529 10.8302 5.89309 10.7842L9.43959 7.36371C9.48612 7.31873 9.54828 7.29355 9.61299 7.29346C9.6777 7.29336 9.73993 7.31837 9.78659 7.36321L13.3481 10.7977C13.3841 10.8322 13.409 10.8768 13.4195 10.9255C13.43 10.9743 13.4257 11.0251 13.4071 11.0714C13.3885 11.1177 13.3564 11.1574 13.3151 11.1854C13.2738 11.2133 13.225 11.2282 13.1751 11.2282Z"
        fill="currentColor"
        className="text-primary"
      />
      <path
        d="M9.61328 17.8845C9.54698 17.8845 9.48339 17.8581 9.4365 17.8112C9.38962 17.7643 9.36328 17.7008 9.36328 17.6345V7.54346C9.36328 7.47715 9.38962 7.41356 9.4365 7.36668C9.48339 7.3198 9.54698 7.29346 9.61328 7.29346C9.67959 7.29346 9.74317 7.3198 9.79006 7.36668C9.83694 7.41356 9.86328 7.47715 9.86328 7.54346V17.635C9.86315 17.7012 9.83675 17.7646 9.78988 17.8114C9.74301 17.8582 9.6795 17.8845 9.61328 17.8845Z"
        fill="currentColor"
        className="text-primary"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="6"
      height="11"
      viewBox="0 0 6 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M0 0.883333L0.884166 0L5.7 4.81417C5.77763 4.89131 5.83924 4.98304 5.88128 5.08408C5.92332 5.18512 5.94496 5.29348 5.94496 5.40292C5.94496 5.51235 5.92332 5.62071 5.88128 5.72175C5.83924 5.8228 5.77763 5.91453 5.7 5.99167L0.884166 10.8083L0.000833035 9.925L4.52083 5.40417L0 0.883333Z"
        fill="white"
        fillOpacity="0.8"
      />
    </svg>
  );
}

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="11"
    height="11"
    viewBox="0 0 11 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g opacity="0.8">
      <path
        d="M3.55469 3.55541L7.4441 7.44482M7.4441 3.55541L3.55469 7.44482"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const LinkFileIcon = () => (
  <svg
    className="h-[30px] w-[30px] shrink-0"
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.625 25.3625C9.25667 24.77 8.06501 23.9658 7.05001 22.95C6.03501 21.9342 5.23084 20.7425 4.63751 19.375C4.04417 18.0075 3.74834 16.5479 3.75001 14.9963C3.75167 13.4446 4.04751 11.9862 4.63751 10.6212C5.22751 9.25625 6.03167 8.06583 7.05001 7.05C8.06834 6.03417 9.26001 5.23 10.625 4.6375C11.9933 4.04583 13.4529 3.75 15.0038 3.75C16.5538 3.75 18.0121 4.04583 19.3788 4.6375C20.7454 5.23 21.9363 6.03417 22.9513 7.05C23.9663 8.06583 24.77 9.25625 25.3625 10.6212C25.9542 11.9879 26.25 13.4462 26.25 14.9963C26.25 16.5462 25.9542 18.0058 25.3625 19.375C24.77 20.7433 23.9658 21.935 22.95 22.95C21.9342 23.965 20.7438 24.7692 19.3788 25.3625C18.0138 25.9558 16.5554 26.2517 15.0038 26.25C13.4521 26.2483 11.9925 25.9525 10.625 25.3625ZM15 25.01C15.7333 24.0675 16.3383 23.1421 16.815 22.2338C17.2908 21.3254 17.6779 20.3088 17.9763 19.1838H12.0238C12.3546 20.3721 12.7496 21.4208 13.2088 22.33C13.6688 23.2383 14.2658 24.1317 15 25.01ZM13.4088 24.8225C12.8254 24.135 12.2929 23.285 11.8113 22.2725C11.3296 21.2608 10.9713 20.2308 10.7363 19.1825H5.94251C6.65917 20.7367 7.67459 22.0117 8.98876 23.0075C10.3038 24.0025 11.7771 24.6075 13.4088 24.8225ZM16.5913 24.8225C18.2229 24.6075 19.6963 24.0025 21.0113 23.0075C22.3254 22.0117 23.3408 20.7367 24.0575 19.1825H19.265C18.9483 20.2467 18.5496 21.2846 18.0688 22.2962C17.5871 23.3088 17.0946 24.1517 16.5913 24.8225ZM5.43251 17.9338H10.4763C10.3813 17.4204 10.3146 16.9204 10.2763 16.4338C10.2363 15.9479 10.2163 15.47 10.2163 15C10.2163 14.53 10.2358 14.0521 10.275 13.5662C10.3142 13.0804 10.3808 12.5804 10.475 12.0662H5.43376C5.29792 12.4996 5.19167 12.9717 5.11501 13.4825C5.03834 13.9925 5.00001 14.4983 5.00001 15C5.00001 15.5017 5.03792 16.0079 5.11376 16.5188C5.18959 17.0296 5.29584 17.5008 5.43251 17.9325M11.7263 17.9325H18.2738C18.3688 17.42 18.4354 16.9283 18.4738 16.4575C18.5138 15.9875 18.5338 15.5017 18.5338 15C18.5338 14.4983 18.5142 14.0125 18.475 13.5425C18.4358 13.0725 18.3692 12.5808 18.275 12.0675H11.725C11.6308 12.58 11.5642 13.0717 11.525 13.5425C11.4858 14.0125 11.4663 14.4983 11.4663 15C11.4663 15.5017 11.4858 15.9875 11.525 16.4575C11.5642 16.9275 11.6321 17.4192 11.7263 17.9325ZM19.525 17.9325H24.5675C24.7033 17.5 24.8096 17.0288 24.8863 16.5188C24.9621 16.0079 25 15.5017 25 15C25 14.4983 24.9621 13.9921 24.8863 13.4812C24.8104 12.9704 24.7042 12.4992 24.5675 12.0675H19.5238C19.6188 12.58 19.6854 13.0796 19.7238 13.5662C19.7638 14.0529 19.7838 14.5308 19.7838 15C19.7838 15.4692 19.7642 15.9471 19.725 16.4338C19.6858 16.9204 19.6192 17.4204 19.525 17.9338M19.265 10.8175H24.0575C23.325 9.23083 22.3217 7.95583 21.0475 6.9925C19.7733 6.02917 18.2879 5.41625 16.5913 5.15375C17.1746 5.92125 17.6992 6.79917 18.165 7.7875C18.6308 8.775 18.9975 9.785 19.265 10.8175ZM12.0238 10.8175H17.9763C17.6463 9.64417 17.2392 8.58333 16.755 7.635C16.2708 6.68667 15.6858 5.805 15 4.99C14.3142 5.80417 13.7292 6.68583 13.245 7.635C12.7608 8.58417 12.3529 9.645 12.0238 10.8175ZM5.94376 10.8175H10.7363C11.0038 9.78583 11.3704 8.77583 11.8363 7.7875C12.3021 6.79917 12.8267 5.92125 13.41 5.15375C11.6983 5.41708 10.2092 6.03375 8.94251 7.00375C7.67584 7.97542 6.67584 9.24625 5.94251 10.8162"
      fill="currentColor"
    />
  </svg>
);

const LinkChainIcon = () => (
  <svg
    className="h-[30px] w-[30px] shrink-0"
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.6606 4.85499C21.4531 3.05499 24.0756 3.01749 25.5268 4.47499C26.9818 5.93499 26.9431 8.57499 25.1481 10.375L22.1193 13.4162C21.9488 13.5933 21.8546 13.8302 21.8571 14.0761C21.8596 14.3219 21.9585 14.5569 22.1326 14.7305C22.3066 14.904 22.5419 15.0023 22.7877 15.0041C23.0336 15.0059 23.2703 14.911 23.4468 14.74L26.4768 11.6987C28.8656 9.29999 29.1656 5.47124 26.8556 3.15124C24.5431 0.829989 20.7218 1.13249 18.3306 3.53124L12.2731 9.61499C9.88432 12.0137 9.58432 15.8425 11.8943 18.1612C11.9806 18.251 12.0839 18.3226 12.1981 18.372C12.3124 18.4214 12.4353 18.4475 12.5598 18.4489C12.6843 18.4502 12.8078 18.4268 12.9231 18.3799C13.0384 18.3331 13.1432 18.2637 13.2314 18.1759C13.3197 18.0881 13.3895 17.9836 13.4369 17.8685C13.4843 17.7534 13.5083 17.63 13.5076 17.5056C13.5068 17.3811 13.4812 17.258 13.4324 17.1435C13.3835 17.0291 13.3124 16.9254 13.2231 16.8387C11.7681 15.3787 11.8081 12.7387 13.6018 10.9387L19.6606 4.85499Z"
      fill="currentColor"
    />
    <path
      d="M18.1068 11.8373C17.9311 11.6611 17.6926 11.5619 17.4438 11.5615C17.1949 11.5612 16.9562 11.6597 16.7799 11.8354C16.6037 12.0111 16.5046 12.2496 16.5042 12.4984C16.5039 12.7473 16.6024 12.9861 16.7781 13.1623C18.2331 14.6223 18.1943 17.261 16.3993 19.0623L10.3406 25.1448C8.54682 26.9448 5.92432 26.9823 4.47307 25.5248C3.01807 24.0648 3.05807 21.4248 4.85182 19.6248L7.88182 16.5835C7.96874 16.4963 8.03763 16.3928 8.08454 16.2789C8.13145 16.165 8.15548 16.043 8.15525 15.9199C8.15502 15.7967 8.13053 15.6748 8.08319 15.5611C8.03584 15.4474 7.96657 15.3442 7.87932 15.2573C7.79208 15.1703 7.68856 15.1015 7.5747 15.0546C7.46083 15.0076 7.33883 14.9836 7.21568 14.9838C7.09253 14.9841 6.97063 15.0086 6.85694 15.0559C6.74324 15.1032 6.63999 15.1725 6.55307 15.2598L3.52307 18.301C1.13432 20.701 0.834324 24.5285 3.14432 26.8485C5.45682 29.171 9.27807 28.8673 11.6693 26.4685L17.7281 20.3848C20.1168 17.9873 20.4168 14.156 18.1068 11.8373Z"
      fill="currentColor"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.99935 3.6665C8.08775 3.6665 8.17254 3.70162 8.23505 3.76414C8.29756 3.82665 8.33268 3.91143 8.33268 3.99984V7.6665H11.9993C12.0878 7.6665 12.1725 7.70162 12.2351 7.76413C12.2976 7.82665 12.3327 7.91143 12.3327 7.99984C12.3327 8.08824 12.2976 8.17303 12.2351 8.23554C12.1725 8.29805 12.0878 8.33317 11.9993 8.33317H8.33268V11.9998C8.33268 12.0882 8.29756 12.173 8.23505 12.2355C8.17254 12.2981 8.08775 12.3332 7.99935 12.3332C7.91094 12.3332 7.82616 12.2981 7.76365 12.2355C7.70113 12.173 7.66602 12.0882 7.66602 11.9998V8.33317H3.99935C3.91094 8.33317 3.82616 8.29805 3.76365 8.23554C3.70113 8.17303 3.66602 8.08824 3.66602 7.99984C3.66602 7.91143 3.70113 7.82665 3.76365 7.76413C3.82616 7.70162 3.91094 7.6665 3.99935 7.6665H7.66602V3.99984C7.66602 3.91143 7.70113 3.82665 7.76365 3.76414C7.82616 3.70162 7.91094 3.6665 7.99935 3.6665Z"
      fill="currentColor"
    />
  </svg>
);

const ArrowIcon = ({ direction = "right" }: { direction?: "left" | "right" }) => (
  <svg
    className={`h-[11px] w-1.5 shrink-0 ${direction === "left" ? "rotate-180" : ""}`}
    width="6"
    height="11"
    viewBox="0 0 6 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 0.883333L0.884166 0L5.7 4.81417C5.77763 4.89131 5.83924 4.98304 5.88128 5.08408C5.92332 5.18512 5.94496 5.29348 5.94496 5.40292C5.94496 5.51235 5.92332 5.62071 5.88128 5.72175C5.83924 5.8228 5.77763 5.91453 5.7 5.99167L0.884166 10.8083L0.000833035 9.925L4.52083 5.40417L0 0.883333Z"
      fill="currentColor"
      fillOpacity="0.8"
    />
  </svg>
);

// ─── Stepper ──────────────────────────────────────────────────────────────────


// ─── Review Step Icons ────────────────────────────────────────────────────────

function ReviewProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 18C4 16.9391 4.42143 15.9217 5.17157 15.1716C5.92172 14.4214 6.93913 14 8 14H16C17.0609 14 18.0783 14.4214 18.8284 15.1716C19.5786 15.9217 20 16.9391 20 18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18Z" stroke="currentColor" strokeOpacity="0.7" strokeLinejoin="round" />
      <path d="M12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10Z" stroke="currentColor" strokeOpacity="0.7" />
    </svg>
  );
}
function ReviewMailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M2.357 7.714L9.337 12.368C10.3 13.009 10.781 13.33 11.301 13.455C11.761 13.565 12.24 13.565 12.699 13.455C13.219 13.33 13.7 13.009 14.663 12.368L21.643 7.714M7.157 19.5H16.843C18.523 19.5 19.363 19.5 20.005 19.173C20.57 18.885 21.028 18.426 21.315 17.862C21.643 17.22 21.643 16.38 21.643 14.7V9.3C21.643 7.62 21.643 6.78 21.316 6.138C21.029 5.574 20.57 5.115 20.005 4.827C19.363 4.5 18.523 4.5 16.843 4.5H7.157C5.477 4.5 4.637 4.5 3.995 4.827C3.431 5.115 2.973 5.574 2.685 6.138C2.357 6.78 2.357 7.62 2.357 9.3V14.7C2.357 16.38 2.357 17.22 2.684 17.862C2.972 18.427 3.431 18.885 3.995 19.173C4.637 19.5 5.477 19.5 7.157 19.5Z" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ReviewPhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M8.38 8.85a10.46 10.46 0 0 0 4.59 4.59l1.53-1.53a.97.97 0 0 1 1-.24c1.1.37 2.29.57 3.5.57.55 0 1 .45 1 1V17c0 .55-.45 1-1 1C9.61 18 4 12.39 4 5.5c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.22.2 2.4.57 3.5a.97.97 0 0 1-.24.99l-1.45 1.46-.05-.08Z" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ReviewLocationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5Z" fill="currentColor" fillOpacity="0.7" />
    </svg>
  );
}

const CHECKLIST_STEPS = [
  { n: 1, label: 'We review your application', done: true },
  { n: 2, label: 'Get approved', done: true },
  { n: 3, label: 'Start earning', done: false },
];

function ChecklistStepper() {
  return (
    <div className="flex flex-col">
      {CHECKLIST_STEPS.map((step, i) => (
        <div key={step.n}>
          {/* Step row: circle + label aligned side-by-side */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                step.done
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card text-muted'
              }`}
            >
              {step.n}
            </div>
            <span
              className={`text-[11px] leading-[16px] ${
                step.done ? 'font-medium text-foreground' : 'text-muted'
              }`}
            >
              {step.label}
            </span>
          </div>
          {/* Connector line — sits directly under the circle center */}
          {i < CHECKLIST_STEPS.length - 1 && (
            <div className="ml-[11px] h-6 w-0.5 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}

const STEPS = [
  { n: 1, label: 'Profile' },
  { n: 2, label: 'Skills' },
  { n: 3, label: 'ID Verify' },
  { n: 4, label: 'Review' },
];

// ─── Verification Helpers ──────────────────────────────────────────────────────

function FileDropzone({
  title,
  helper,
  onSelect,
}: {
  title: string;
  helper: string;
  onSelect: (file: UploadedFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelect({
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / (1024 * 1024)))}MB`,
    });
    e.target.value = '';
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex w-full items-center gap-1.5 self-stretch rounded-[8px] border border-dashed border-border text-left hover:border-primary transition-colors"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 self-stretch rounded-[8px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 py-5">
        <UploadCloud className="h-5 w-5 text-primary/60" />
        <div className="flex flex-col items-center text-center gap-0.5">
          <span className="text-[12px] font-medium text-foreground">{title}</span>
          <span className="text-[10px] leading-[13px] text-muted">{helper}</span>
        </div>
      </div>
    </button>
  );
}

function UploadedFileRow({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <FileIcon className="h-[26px] w-[26px] shrink-0 text-primary/60" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-foreground">{file.name}</p>
          <p className="text-[10px] text-muted">{file.size}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove file"
          className="text-muted transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function StepBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex h-[60px] w-full items-center gap-3 rounded-[8px] border border-border bg-card px-[10px]">
      {STEPS.map((step, i) => {
        const isActive = step.n <= currentStep;
        const isCurrent = step.n === currentStep;
        return (
          <div key={step.n} className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center gap-[5px]">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isActive
                    ? 'border-primary bg-primary'
                    : 'border-border bg-transparent'
                }`}
              >
                {isActive && step.n < currentStep ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  <span className={`text-[10px] font-semibold leading-[13px] ${isActive ? 'text-white' : 'text-muted'}`}>
                    {step.n}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium leading-[13px] transition-colors ${
                  isCurrent ? 'text-foreground' : isActive ? 'text-primary' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 transition-colors ${
                  step.n < currentStep ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Form Field Components ─────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[13px] font-medium leading-[18px] text-foreground/80">
      {children}
    </label>
  );
}

function TextInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-[5px]">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-[38px] w-full rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col gap-[5px] relative">
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex h-[38px] w-full items-center justify-between rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-left text-[11px] text-foreground outline-none focus:border-primary transition-colors"
      >
        <span className={value ? 'text-foreground' : 'text-muted'}>{value || 'Select…'}</span>
        <ChevronDownIcon
          className={`shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Click-outside backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => { setIsOpen(false); setSearchQuery(''); }} />
          {/* Dropdown list */}
          <div className="absolute left-0 top-[64px] z-40 w-full rounded-lg border border-border bg-card shadow-xl py-1 max-h-[220px] overflow-y-auto flex flex-col">
            {options.length > 4 && (
              <div className="px-2 py-1.5 border-b border-border sticky top-0 bg-card z-10">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[28px] rounded-[4px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-2 text-[10px] text-foreground outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
            )}
            <div className="overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[11px] text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5 ${
                      value === opt ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    <span>{opt}</span>
                    {value === opt && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-[11px] text-muted text-center">No options found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Terms Checkbox ───────────────────────────────────────────────────────────

function TermsCheckbox({
  agreed,
  onToggle,
}: {
  agreed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-border/10"
    >
      {/* Checkbox mark */}
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
          agreed
            ? 'border-primary bg-primary'
            : 'border-border bg-[#F5F8FB] dark:bg-[#161616]'
        }`}
      >
        {agreed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
      </span>
      {/* Text */}
      <span className="flex-1 text-[11px] leading-[18px]">
        <span className="text-muted">I have read and agree to CanaFri&rsquo;s </span>
        <span className="font-semibold text-primary underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity">
          Terms of Service
        </span>
        <span className="text-muted">, </span>
        <span className="font-semibold text-primary underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity">
          Privacy Policy
        </span>
        <span className="text-muted">, and </span>
        <span className="font-semibold text-primary underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity">
          Seller Agreement
        </span>
        <span className="text-muted">.</span>
      </span>
    </button>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

interface BecomeSellerPageProps {
  onBack: () => void;
}

export default function BecomeSellerPage({ onBack }: BecomeSellerPageProps) {
  const { toast } = useToast();

  // Wizard step state (1 = Profile, 2 = Skills, 3 = ID Verify, 4 = Review)
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 4;
  const isLastStep = currentStep === TOTAL_STEPS;

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPhonePrefix, setSelectedPhonePrefix] = useState(PHONE_PREFIX_OPTIONS[0]);
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [country, setCountry] = useState('United States');
  const [city, setCity] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 states
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([
    "React.js",
    "Next.js",
    "Canton Ledger",
    "Tailwind CSS",
  ]);
  const [primaryCategory, setPrimaryCategory] = useState("Development & IT");
  const [subCategory, setSubCategory] = useState("Web Development");
  const [yearsOfExperience, setYearsOfExperience] = useState("5 - 7 years");
  const [language, setLanguage] = useState("English");
  const [hourlyRate, setHourlyRate] = useState("120");
  const [availability, setAvailability] = useState("More than 30hrs/week");
  const [skillsBio, setSkillsBio] = useState(
    "I am a fullstack developer with over 6 years of experience building modern web applications.",
  );
  const [portfolioLinks, setPortfolioLinks] = useState([
    "dashboard-project-2025.pdf",
    "portfolio-site.link",
  ]);

  // Step 3 (Verification) states
  const [idType, setIdType] = useState('');
  const [idTypeOpen, setIdTypeOpen] = useState(false);
  const [frontFile, setFrontFile] = useState<UploadedFile | null>(null);
  const [backFile, setBackFile] = useState<UploadedFile | null>(null);
  const [addressFile, setAddressFile] = useState<UploadedFile | null>(null);
  const [selfieFile, setSelfieFile] = useState<UploadedFile | null>(null);

  // Search states for custom inline dropdowns
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [idTypeSearchQuery, setIdTypeSearchQuery] = useState('');

  // Modal / submission state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const ID_TYPE_OPTIONS = [
    'National ID Card',
    'International Passport',
    "Driver's License",
    'Residence Permit',
    'Voter\'s Card',
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Photo must be under 5MB.', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    toast('Profile photo uploaded successfully.', 'success');
  };

  const handleCancel = () => {
    if (currentStep === 1) {
      onBack();
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveAndContinue = () => {
    if (currentStep === 1) {
      if (!fullName.trim()) { toast('Please enter your full name.', 'error'); return; }
      if (!username.trim()) { toast('Please enter a username.', 'error'); return; }
      if (!email.trim()) { toast('Please enter your email address.', 'error'); return; }
      if (!phone.trim()) { toast('Please enter your phone number.', 'error'); return; }
      if (!headline.trim()) { toast('Please add a professional headline.', 'error'); return; }
      if (!bio.trim()) { toast('Please write a short bio.', 'error'); return; }
      if (!agreed) { toast('Please agree to the Terms of Service before continuing.', 'error'); return; }
      toast('Profile saved! Proceeding to Skills setup…', 'success');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (skills.length === 0) { toast('Please add at least one skill.', 'error'); return; }
      if (!skillsBio.trim()) { toast('Please write about your experience.', 'error'); return; }
      if (!hourlyRate.trim() || Number(hourlyRate) <= 0) { toast('Please enter a valid hourly rate.', 'error'); return; }
      toast('Skills & experience updated. Previewing registration details…', 'success');
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!idType) { toast('Please select your ID type.', 'error'); return; }
      if (!frontFile) { toast('Please upload the front side of your government ID.', 'error'); return; }
      toast('Identity verified! Previewing your registration…', 'success');
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setShowSuccessModal(true);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast('Skill already added.', 'info');
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const addPortfolioLink = () => {
    if (portfolioLinks.length >= 3) {
      toast('Max 3 portfolio links allowed.', 'info');
      return;
    }
    setPortfolioLinks((prev) => [...prev, ""]);
  };

  const handleSkillKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  };


  // ─── Sidebar cards (shared between desktop aside + mobile last-step inline) ──
  function SidebarCards() {
    return (
      <>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-primary/5 p-6">
          <h3 className="text-[13px] font-semibold leading-[18px] text-primary">
            Why become a seller?
          </h3>
          <ul className="flex flex-col gap-2 pl-0">
            {[
              'Access global clients',
              'Earn on your terms',
              'Secure Canton escrow payments',
              'Build your reputation on-chain',
              'Zero payment disputes',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[12px] leading-[17px] text-primary/70">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
          <h4 className="text-[12px] font-semibold text-foreground">Tips for a great profile</h4>
          <ul className="flex flex-col gap-2">
            {[
              'Use your real name for trust signals',
              'Write a clear, concise headline',
              'Add a professional profile photo',
              'Complete all sections before continuing',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-[11px] leading-[16px] text-muted">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-background pb-[76px] lg:pb-12">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-4 py-6 lg:flex-row lg:px-8">

        {/* ── Left main column ── */}
        <div className="flex w-full flex-1 flex-col gap-6">

          {/* Back arrow + page title breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted transition-colors hover:border-primary hover:text-primary"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-[13px] font-semibold text-foreground">
                {currentStep === 1 && 'Become a Seller — Profile'}
                {currentStep === 2 && 'Become a Seller — Skills'}
                {currentStep === 3 && 'Become a Seller — Identity Verification'}
                {currentStep === 4 && 'Become a Seller — Review'}
              </h1>
              <p className="text-[10px] text-muted">Step {currentStep} of {TOTAL_STEPS}</p>
            </div>
          </div>

          {/* Step progress bar */}
          <StepBar currentStep={currentStep} />

          {/* Step 1: Personal Profile Information */}
          {currentStep === 1 && (
            <>
              {/* Professional Information card */}
              <div className="flex w-full flex-col gap-5 rounded-2xl border border-border bg-card px-4 py-6">
                <div className="flex flex-col gap-1">
                  <h1 className="text-[13px] font-semibold leading-[18px] text-foreground">
                    Professional Information
                  </h1>
                  <p className="text-[11px] font-normal leading-4 text-muted">
                    Tell us about yourself. This information will be visible on your profile.
                  </p>
                </div>

                {/* Full Name + Username */}
                <div className="flex w-full flex-col gap-[14px] sm:flex-row sm:gap-6">
                  <TextInput label="Full Name" placeholder="e.g. John Trek" value={fullName} onChange={setFullName} />
                  <TextInput label="Username" placeholder="e.g. johntrek" value={username} onChange={setUsername} />
                </div>

                {/* Email + Phone */}
                <div className="flex w-full flex-col gap-[14px] sm:flex-row sm:gap-6">
                  <TextInput label="Email Address" placeholder="john@example.com" value={email} onChange={setEmail} type="email" />

                  {/* Phone with country code prefix */}
                  <div className="flex flex-1 flex-col gap-[5px]">
                    <FieldLabel>Phone Number</FieldLabel>
                    <div className="flex h-[38px] w-full">
                      <div className="relative flex shrink-0">
                        <button
                          type="button"
                          onClick={() => setPhoneDropdownOpen(!phoneDropdownOpen)}
                          className="flex items-center gap-[5px] rounded-l-[5px] border border-r-0 border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 outline-none focus:border-primary transition-colors"
                        >
                          <selectedPhonePrefix.FlagComponent />
                          <span className="text-[11px] text-muted">{selectedPhonePrefix.prefix}</span>
                          <ChevronDownIcon className={`text-muted transition-transform duration-200 ${phoneDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {phoneDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => { setPhoneDropdownOpen(false); setPhoneSearchQuery(''); }} />
                            <div className="absolute left-0 top-[40px] z-40 min-w-[200px] rounded-lg border border-border bg-card shadow-xl py-1 max-h-[220px] overflow-y-auto no-scrollbar flex flex-col animate-in fade-in duration-100">
                              <div className="px-2 py-1.5 border-b border-border sticky top-0 bg-card z-10">
                                <input
                                  type="text"
                                  placeholder="Search country..."
                                  value={phoneSearchQuery}
                                  onChange={(e) => setPhoneSearchQuery(e.target.value)}
                                  className="w-full h-[28px] rounded-[4px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-2 text-[10px] text-foreground outline-none focus:border-primary transition-colors"
                                  autoFocus
                                />
                              </div>
                              <div className="overflow-y-auto">
                                {PHONE_PREFIX_OPTIONS.filter((opt) =>
                                  opt.name.toLowerCase().includes(phoneSearchQuery.toLowerCase()) ||
                                  opt.prefix.toLowerCase().includes(phoneSearchQuery.toLowerCase())
                                ).map((opt) => {
                                  const Flag = opt.FlagComponent;
                                  return (
                                    <button
                                      key={opt.code}
                                      type="button"
                                      onClick={() => {
                                        setSelectedPhonePrefix(opt);
                                        setPhoneDropdownOpen(false);
                                        setPhoneSearchQuery('');
                                      }}
                                      className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5 ${
                                        selectedPhonePrefix.code === opt.code ? 'text-primary font-semibold' : 'text-foreground'
                                      }`}
                                    >
                                      <Flag />
                                      <span className="w-10 shrink-0 text-muted">{opt.prefix}</span>
                                      <span className="truncate">{opt.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="min-w-0 flex-1 rounded-r-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Country + City */}
                <div className="flex w-full flex-col gap-[14px] sm:flex-row sm:gap-6">
                  <SelectInput
                    label="Country"
                    value={country}
                    onChange={setCountry}
                    options={['United States', 'Canada', 'United Kingdom', 'Nigeria', 'Germany', 'France', 'Australia']}
                  />
                  <TextInput label="City" placeholder="e.g. New York" value={city} onChange={setCity} />
                </div>
              </div>

              {/* About You card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-6">
                <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">
                  About You
                </h2>

                {/* Professional Headline */}
                <TextInput
                  label="Professional Headline"
                  placeholder="e.g. Full Stack Web Developer & Canton DApp Builder"
                  value={headline}
                  onChange={setHeadline}
                />

                {/* Short Bio */}
                <div className="flex flex-col gap-[5px]">
                  <FieldLabel>Short Bio</FieldLabel>
                  <div className="flex flex-col gap-2 rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 py-2.5 focus-within:border-primary transition-colors">
                    <textarea
                      value={bio}
                      maxLength={300}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write a short bio about yourself, your experience and what you do best"
                      rows={4}
                      className="w-full resize-none bg-transparent text-[11px] text-foreground placeholder:text-muted outline-none"
                    />
                    <span className="self-end text-[10px] text-muted/60">
                      {bio.length}/300
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Photo card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">
                    Profile Photo
                  </h2>
                  <p className="text-[11px] text-muted">
                    Add a professional photo — it helps clients trust you.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  {/* Avatar preview */}
                  <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-[#F5F8FB] dark:bg-[#161616]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-muted">
                        <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.4" />
                        <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="currentColor" opacity="0.4" />
                      </svg>
                    )}
                  </div>

                  {/* Upload button */}
                  <div className="flex w-full flex-col items-center gap-1.5">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full max-w-[280px] items-center justify-center gap-3 rounded-[10px] border border-dashed border-border bg-background px-6 py-4 transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <UploadIcon />
                      <span className="text-[13px] font-medium leading-[18px] text-foreground">
                        {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </button>
                    <span className="text-[11px] text-muted">
                      JPG, PNG or WebP · Max 5MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms of Service */}
              <TermsCheckbox agreed={agreed} onToggle={() => setAgreed((a) => !a)} />
            </>
          )}

          {/* Step 2: Skill and Expertise Registration */}
          {currentStep === 2 && (
            <>
              {/* Skill and Expertise Card */}
              <div className="flex w-full flex-col items-start gap-8 rounded-2xl border border-border bg-card px-4 py-6">
                <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">
                  Skill and Expertise
                </h2>

                <div className="flex w-full flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Skill</FieldLabel>
                    <div className="flex w-full items-center gap-2">
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        placeholder="e.g. React.js, Canton, Escrow"
                        className="h-[38px] flex-1 rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="h-[38px] shrink-0 rounded-[8px] bg-primary px-5 text-[13px] font-semibold text-white hover:bg-primary-hover transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {skills.map((skill, idx) => (
                        <div
                          key={`${skill}-${idx}`}
                          className="flex items-center gap-2.5 rounded-[5px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] border border-[#8C5CFF]/20 px-3 py-1.5"
                        >
                          <span className="text-[10px] leading-[13px] text-primary font-medium">{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(idx)}
                            className="text-primary hover:opacity-85 transition-opacity"
                            aria-label={`Remove ${skill}`}
                          >
                            <CloseIcon className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-col gap-[14px] sm:flex-row sm:gap-6">
                  <SelectInput
                    label="Primary Category"
                    value={primaryCategory}
                    onChange={setPrimaryCategory}
                    options={['Development & IT', 'Design & Creative', 'Sales & Marketing', 'Writing & Translation', 'Finance & Accounting', 'Canton Integration & blockchain']}
                  />
                  <SelectInput
                    label="Sub Category"
                    value={subCategory}
                    onChange={setSubCategory}
                    options={['Web Development', 'Mobile Development', 'UI/UX Design', 'Smart Contract Development', 'Escrow & Wallet Integration', 'Full Stack Development']}
                  />
                </div>

                <div className="flex w-full flex-col gap-[14px] sm:flex-row sm:gap-6">
                  <SelectInput
                    label="Years of Experience"
                    value={yearsOfExperience}
                    onChange={setYearsOfExperience}
                    options={['Entry Level (0-2 years)', 'Intermediate (2-5 years)', 'Expert (5+ years)', '5 - 7 years', '7+ years']}
                  />
                  <SelectInput
                    label="Language"
                    value={language}
                    onChange={setLanguage}
                    options={['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']}
                  />
                </div>

                <div className="flex w-full flex-col gap-[14px] sm:flex-row sm:gap-6">
                  <TextInput
                    label="Hourly Rate (CC)"
                    placeholder="120"
                    value={hourlyRate}
                    onChange={setHourlyRate}
                    type="number"
                  />
                  <SelectInput
                    label="Availability"
                    value={availability}
                    onChange={setAvailability}
                    options={['More than 30hrs/week', '20-30 hrs/week', '10-20 hrs/week', 'Less than 10 hrs/week']}
                  />
                </div>
              </div>

              {/* About your experience Card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-6">
                <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">
                  About your Experience
                </h2>

                <div className="flex flex-col gap-[5px] w-full">
                  <FieldLabel>Describe your experience</FieldLabel>
                  <div className="flex flex-col gap-2 rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 py-2.5 focus-within:border-primary transition-colors">
                    <textarea
                      value={skillsBio}
                      maxLength={300}
                      onChange={(e) => setSkillsBio(e.target.value)}
                      placeholder="Describe your previous projects, achievements, and unique strengths"
                      rows={4}
                      className="w-full resize-none bg-transparent text-[11px] text-foreground placeholder:text-muted outline-none"
                    />
                    <span className="self-end text-[10px] text-muted/60">
                      {skillsBio.length}/300
                    </span>
                  </div>
                </div>
              </div>

              {/* Portfolio Link Card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">
                    Portfolio Link (Optional up to 3)
                  </h2>
                  <p className="text-[11px] text-muted">
                    Showcase past work files or project links to stand out.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {portfolioLinks.map((link, index) => {
                    const isFile = link.endsWith(".pdf") || link.endsWith(".png") || link.endsWith(".jpg") || link.endsWith(".docx");
                    return (
                      <div
                        key={index}
                        className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-dashed border-border bg-[#F5F8FB] dark:bg-[#161616] px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isFile ? <LinkFileIcon /> : <LinkChainIcon />}
                          <input
                            type="text"
                            value={link}
                            onChange={(e) => {
                              const newLinks = [...portfolioLinks];
                              newLinks[index] = e.target.value;
                              setPortfolioLinks(newLinks);
                            }}
                            placeholder="Add a portfolio file link or URL"
                            className="bg-transparent text-[11px] text-foreground outline-none w-full min-w-0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          className="text-muted hover:text-foreground transition-colors p-1"
                          aria-label="Remove link"
                        >
                          <CloseIcon className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}

                  {portfolioLinks.length < 3 && (
                    <button
                      type="button"
                      onClick={addPortfolioLink}
                      className="flex items-center gap-1.5 text-primary text-[11px] font-semibold hover:opacity-85 w-fit"
                    >
                      <PlusIcon />
                      <span>Add another link</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Identity Verification */}
          {currentStep === 3 && (
            <>
              <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-card px-4 py-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">Verification</h2>
                  <p className="text-[11px] text-muted">
                    Upload a government-issued ID to verify your identity.
                  </p>
                </div>

                {/* Country — auto-filled from Step 1 */}
                <div className="flex flex-col gap-[5px]">
                  <label className="block text-[13px] font-medium leading-[18px] text-foreground/80">
                    Country
                  </label>
                  <div className="flex h-[38px] w-full items-center justify-between rounded-[5px] border border-border bg-[#F5F8FB]/60 dark:bg-[#161616]/60 px-3 text-[11px] text-foreground opacity-80 cursor-not-allowed select-none">
                    <span>{country || 'Not set — please complete Step 1'}</span>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Auto-filled
                    </span>
                  </div>
                </div>

                {/* ID Type dropdown */}
                <div className="flex flex-col gap-[5px] relative">
                  <label className="block text-[13px] font-medium leading-[18px] text-foreground/80">
                    ID Type <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIdTypeOpen((o) => !o)}
                    className="flex h-[38px] w-full items-center justify-between rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-left text-[11px] text-foreground outline-none focus:border-primary transition-colors"
                  >
                    <span className={idType ? 'text-foreground' : 'text-muted'}>
                      {idType || 'Select ID type'}
                    </span>
                    <ChevronDownIcon className={`shrink-0 text-muted transition-transform duration-200 ${idTypeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {idTypeOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => { setIdTypeOpen(false); setIdTypeSearchQuery(''); }} />
                      <div className="absolute left-0 top-[64px] z-40 w-full rounded-lg border border-border bg-card shadow-xl py-1 max-h-[220px] overflow-y-auto flex flex-col">
                        <div className="px-2 py-1.5 border-b border-border sticky top-0 bg-card z-10">
                          <input
                            type="text"
                            placeholder="Search ID type..."
                            value={idTypeSearchQuery}
                            onChange={(e) => setIdTypeSearchQuery(e.target.value)}
                            className="w-full h-[28px] rounded-[4px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-2 text-[10px] text-foreground outline-none focus:border-primary transition-colors"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto">
                          {ID_TYPE_OPTIONS.filter((opt) =>
                            opt.toLowerCase().includes(idTypeSearchQuery.toLowerCase())
                          ).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setIdType(opt);
                                setIdTypeOpen(false);
                                setIdTypeSearchQuery('');
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-[11px] text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5 ${
                                idType === opt ? 'text-primary font-semibold' : 'text-foreground'
                              }`}
                            >
                              <span>{opt}</span>
                              {idType === opt && <Check className="h-3 w-3 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Government ID — front */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[12px] font-semibold text-foreground">Upload Document</h3>
                    <p className="text-[10px] text-muted">Upload front side of your government-issued ID</p>
                  </div>
                  <FileDropzone
                    title="Upload front side"
                    helper="PDF, DOC, JPG, PNG · Max 5MB"
                    onSelect={setFrontFile}
                  />
                  {frontFile && (
                    <UploadedFileRow file={frontFile} onRemove={() => setFrontFile(null)} />
                  )}
                </div>

                {/* Government ID — back */}
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] text-muted">Upload back side of your ID</p>
                  <FileDropzone
                    title="Upload back side"
                    helper="PDF, DOC, JPG, PNG · Max 5MB"
                    onSelect={setBackFile}
                  />
                  {backFile && (
                    <UploadedFileRow file={backFile} onRemove={() => setBackFile(null)} />
                  )}
                </div>
              </div>

              {/* Address & Selfie verification */}
              <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-card px-4 py-6">
                {/* Address */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[12px] font-semibold text-foreground">Address Verification <span className="text-muted font-normal">(Optional)</span></h3>
                    <p className="text-[10px] text-muted">Upload a utility bill or bank statement showing your address</p>
                  </div>
                  <FileDropzone
                    title="Upload document"
                    helper="PDF, DOC, JPG, PNG · Max 5MB"
                    onSelect={setAddressFile}
                  />
                  {addressFile && (
                    <UploadedFileRow file={addressFile} onRemove={() => setAddressFile(null)} />
                  )}
                </div>

                {/* Selfie */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[12px] font-semibold text-foreground">Selfie Verification</h3>
                    <p className="text-[10px] text-muted">Take a clear selfie holding your ID document</p>
                  </div>
                  <FileDropzone
                    title="Upload selfie"
                    helper="JPG, PNG · Good lighting, Max 5MB"
                    onSelect={setSelfieFile}
                  />
                  {selfieFile && (
                    <UploadedFileRow file={selfieFile} onRemove={() => setSelfieFile(null)} />
                  )}
                </div>

                {/* Tips card inline */}
                <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-primary/5 p-4">
                  <h4 className="text-[12px] font-semibold text-primary">Verification Tips</h4>
                  <ul className="flex flex-col gap-1.5">
                    {[
                      'Use a valid government-issued photo ID',
                      'Ensure all text and details are clearly visible',
                      'Use good lighting for selfie photos',
                      'Files must be original — no screenshots',
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-[11px] leading-[16px] text-primary/70">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Summary & Review */}
          {currentStep === 4 && (
            <>
              {/* Personal Information card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-5">
                <div className="flex w-full items-center justify-between">
                  <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">Personal Information</h2>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[10px] leading-[13px] text-muted transition-colors hover:text-primary"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-[#F5F8FB] dark:bg-[#161616] p-4">
                  <div className="flex w-full items-center justify-between gap-3">
                    <ReviewProfileIcon />
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-foreground">{fullName || 'John Trek'}</span>
                      <span className="text-[10px] text-muted">@{username || 'johntrek'}</span>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3">
                    <ReviewMailIcon />
                    <span className="flex-1 text-[11px] text-foreground">{email || 'johntrek@gmail.com'}</span>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3">
                    <ReviewPhoneIcon />
                    <span className="flex-1 text-[11px] text-foreground">{selectedPhonePrefix.prefix} {phone || '—'}</span>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3">
                    <ReviewLocationIcon />
                    <span className="flex-1 text-[11px] text-foreground">{country}{city ? `, ${city}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Professional Information card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-5">
                <div className="flex w-full items-center justify-between">
                  <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">Professional Information</h2>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[10px] leading-[13px] text-muted transition-colors hover:text-primary"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-[11px] leading-[15px] text-muted">{headline || 'Full Stack Development | Web 3 Expert'}</p>
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted">Category</span>
                    <span className="font-medium text-foreground text-right">{primaryCategory} &rsaquo; {subCategory}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted">Experience</span>
                    <span className="font-medium text-foreground">{yearsOfExperience}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted">Hourly Rate</span>
                    <span className="font-semibold text-primary">{hourlyRate} CC</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted">Availability</span>
                    <span className="font-medium text-foreground">{availability}</span>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted">Skills</span>
                      <span className="font-medium text-foreground text-right max-w-[55%]">{skills.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification / Documents card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-5">
                <div className="flex w-full items-center justify-between">
                  <h2 className="text-[13px] font-semibold leading-[18px] text-foreground">Verification Documents</h2>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-[10px] leading-[13px] text-muted transition-colors hover:text-primary"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Identity document', value: idType || 'Government ID', uploaded: !!frontFile },
                    { label: 'Address document', value: addressFile?.name ?? (addressFile ? 'Uploaded' : null), uploaded: !!addressFile },
                    { label: 'Selfie verification', value: null, uploaded: !!selfieFile },
                  ].map(({ label, value, uploaded }) => (
                    <div key={label} className="flex w-full items-center justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-medium text-foreground">{label}</span>
                        {value && <span className="text-[10px] text-muted">{value}</span>}
                      </div>
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] leading-[13px] font-medium ${
                        uploaded
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-border text-muted'
                      }`}>
                        {uploaded ? 'Verified' : 'Not uploaded'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Mobile/Tablet: sidebar cards inline — only on last step */}
          {isLastStep && (
            <div className="flex flex-col gap-6 lg:hidden">
              {/* Checklist card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-4">
                <h3 className="text-[13px] font-semibold text-foreground">Checklist</h3>
                <ChecklistStepper />
                <div className="flex flex-col gap-1 rounded-xl border border-border bg-[#F5F8FB] dark:bg-[#161616] p-3">
                  <span className="text-[10px] text-muted">Estimated review time</span>
                  <span className="text-[15px] font-semibold text-foreground">24 – 48 hours</span>
                </div>
              </div>
              <SidebarCards />
            </div>
          )}

          {/* Action buttons — static on desktop, pushed to sticky bar on mobile via hidden */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-[38px] flex-1 items-center justify-center gap-2 rounded-xl border border-primary text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              {currentStep === 1 ? null : <ArrowIcon direction="left" />}
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="button"
              onClick={handleSaveAndContinue}
              className="flex h-[38px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {currentStep === TOTAL_STEPS ? 'Submit for Review' : 'Save and Continue'}
              {currentStep === TOTAL_STEPS ? null : <ArrowIcon direction="right" />}
            </button>
          </div>
        </div>

        {/* ── Right sidebar — desktop only ── */}
        <aside className="hidden lg:flex w-full flex-col gap-6 lg:w-[320px] lg:shrink-0">
          {currentStep === 4 ? (
            <>
              {/* Checklist card */}
              <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-4">
                <h3 className="text-[13px] font-semibold text-foreground">Checklist</h3>
                <ChecklistStepper />
                <div className="flex flex-col gap-1 rounded-xl border border-border bg-[#F5F8FB] dark:bg-[#161616] p-3">
                  <span className="text-[10px] text-muted">Estimated review time</span>
                  <span className="text-[15px] font-semibold text-foreground">24 – 48 hours</span>
                </div>
              </div>
              <SidebarCards />
            </>
          ) : (
            <SidebarCards />
          )}
        </aside>

      </div>

      {/* Sticky bottom action bar — mobile/tablet only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={handleCancel}
          className="flex h-[38px] flex-1 items-center justify-center gap-2 rounded-xl border border-primary text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10"
        >
        {currentStep === 1 ? null : <ArrowIcon direction="left" />}
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>
        <button
          type="button"
          onClick={handleSaveAndContinue}
          className="flex h-[38px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-white transition-colors hover:bg-primary/90"
        >
          {currentStep === TOTAL_STEPS ? 'Submit for Review' : 'Save and Continue'}
          {currentStep === TOTAL_STEPS ? null : <ArrowIcon direction="right" />}
        </button>
      </div>

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[440px] rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center flex flex-col items-center gap-5">
            {/* Success Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-[16px] font-bold text-foreground">
                Application Submitted Successfully!
              </h3>
              <p className="text-[12px] leading-relaxed text-muted px-2">
                Your application to become a seller is currently under review. Our team will verify your profile and verification documents within <strong>24 to 48 hours</strong>. You will be live on the platform as soon as the review is complete!
              </p>
            </div>

            {/* Checklist Preview inline */}
            <div className="w-full rounded-xl border border-border bg-[#F5F8FB] dark:bg-[#161616] p-4 text-left flex flex-col gap-3">
              <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Next Steps:</span>
              <ChecklistStepper />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                onBack();
              }}
              className="w-full h-[40px] flex items-center justify-center rounded-xl bg-primary text-[13px] font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

