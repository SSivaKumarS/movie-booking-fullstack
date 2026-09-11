import React from "react";
import "./GradientText.css";

const GradientText = ({
  children,
  colors,
  animationSpeed = 5,
  showBorder = false,
  className = "",
}) => {
  const gradientStyle = {
    "--gradient-colors": colors.join(", "),
    "--animation-speed": `${animationSpeed}s`,
  };

  const borderClass = showBorder ? "gradient-border" : "";

  return (
    <span
      style={gradientStyle}
      className={`gradient-text ${borderClass} ${className}`}
    >
      {children}
    </span>
  );
};

export default GradientText;
