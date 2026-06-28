/** velopX Clerk Appearance theme — navy/orange, light + dark */
export const clerkDarkTheme = {
  variables: {
    colorPrimary: '#F5A623',
    colorBackground: '#0C1526',
    colorText: '#E8ECF1',
    colorTextSecondary: '#8A97AA',
    colorInputBackground: '#111E34',
    colorInputText: '#E8ECF1',
    colorNeutral: '#8A97AA',
    borderRadius: '10px',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '16px',
  },
  elements: {
    card: 'shadow-none border border-[#1E2E48] bg-[#0C1526]',
    headerTitle: 'text-white font-bold',
    headerSubtitle: 'text-[#8A97AA]',
    formButtonPrimary:
      'bg-[#F5A623] text-black font-semibold hover:bg-[#d4911f] focus-visible:ring-[#F5A623]',
    footerActionLink: 'text-[#F5A623] hover:text-[#f7bc5a]',
    identityPreviewEditButton: 'text-[#F5A623]',
    formFieldInput: 'bg-[#111E34] border-[#1E2E48] text-[#E8ECF1]',
    dividerLine: 'bg-[#1E2E48]',
    socialButtonsBlockButton: 'border-[#1E2E48] text-[#E8ECF1] hover:bg-[#111E34]',
  },
}

export const clerkLightTheme = {
  variables: {
    colorPrimary: '#E09410',
    colorBackground: '#FFFFFF',
    colorText: '#0C1526',
    colorTextSecondary: '#4A5568',
    colorInputBackground: '#F4F6F9',
    colorInputText: '#0C1526',
    colorNeutral: '#8A97AA',
    borderRadius: '10px',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '16px',
  },
  elements: {
    card: 'shadow-none border border-[#D8E0EA] bg-white',
    headerTitle: 'text-[#0C1526] font-bold',
    headerSubtitle: 'text-[#4A5568]',
    formButtonPrimary:
      'bg-[#E09410] text-white font-semibold hover:bg-[#c8840e] focus-visible:ring-[#E09410]',
    footerActionLink: 'text-[#E09410] hover:text-[#F5A623]',
    identityPreviewEditButton: 'text-[#E09410]',
    formFieldInput: 'bg-[#F4F6F9] border-[#D8E0EA] text-[#0C1526]',
    dividerLine: 'bg-[#D8E0EA]',
    socialButtonsBlockButton: 'border-[#D8E0EA] text-[#0C1526] hover:bg-[#F4F6F9]',
  },
}

/** @deprecated Use getClerkTheme(resolvedTheme) */
export const velopXTheme = clerkDarkTheme

export function getClerkTheme(resolvedTheme: string | undefined) {
  return resolvedTheme === 'light' ? clerkLightTheme : clerkDarkTheme
}
