import { ChromaticButton, type ChromaticButtonProps } from "./chromatic-button";

/**
 * The site CTA: ChromaticButton locked to the $COOKED palette — a yellow
 * gradient field, warm hue travel, soft rectangular silhouette, black label
 * in the page font.
 */
const CookedButton = ({ className, style, children, ...props }: ChromaticButtonProps) => (
  <ChromaticButton
    color="#FFD500"
    colorMode="gradient-3"
    color2="#FFA000"
    color3="#FFF27A"
    speed={0.6}
    intensity={1.3}
    grain={0.105}
    borderRadius={30}
    hoverEffect="brighten"
    className={className}
    style={{
      color: "#000",
      fontFamily: "inherit",
      fontSize: "1.0625rem",
      fontWeight: 500,
      height: "auto",
      minHeight: 54,
      padding: "13px 30px",
      ...style,
    }}
    {...props}
  >
    {children}
  </ChromaticButton>
);

export default CookedButton;
