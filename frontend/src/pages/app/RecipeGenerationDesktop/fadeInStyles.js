const STYLE_ID = 'recipe-generation-fade-in';

const STYLES = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

export function ensureFadeInStyles() {
        if (typeof document === 'undefined') {
                return;
        }
        if (document.getElementById(STYLE_ID)) {
                return;
        }
        const styleElement = document.createElement('style');
        styleElement.id = STYLE_ID;
        styleElement.textContent = STYLES;
        document.head.appendChild(styleElement);
}
