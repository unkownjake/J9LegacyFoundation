import type React from "react";

interface J9LogoProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  primaryColor?: string;
  strokeColor?: string;
  textColor?: string;
}

export const J9Logo: React.FC<J9LogoProps> = ({
  width = 402,
  height = 65,
  className = "",
  primaryColor = "white",
  strokeColor = "#FF8600",
  textColor = "#223A58",
}) => {
  const calculatedHeight =
    height === "auto"
      ? typeof width === "number"
        ? (width * 65) / 402
        : 65
      : height;

  return (
    <svg
      width={width}
      height={calculatedHeight}
      viewBox="0 0 402 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="J9 Legacy Foundation Logo"
      role="img"
    >
      <path
        d="M66.928 18.3597C63.5533 14.905 59.1801 13.1877 53.8385 13.1877C48.2174 13.1877 43.5148 14.905 39.7307 18.3296C39.1017 18.902 38.5326 19.5046 38.0134 20.1273V2H7.43146V14.7443H24.2151V33.7754C24.2151 38.1139 21.8388 39.6203 20.0417 39.6203C18.2445 39.6203 15.7983 38.1139 15.7983 33.7754V28.0109H2V36.3464C2 46.6905 9.96748 51.9127 20.0417 51.9127C28.1689 51.9127 34.9582 48.458 37.2147 41.5988C37.644 42.2214 38.1033 42.824 38.6225 43.3964C40.6992 45.6762 42.6861 47.5743 46.9893 48.9099C47.4985 49.0706 47.8579 49.2715 50.2142 49.623L39.9803 63H56.4644L64.0126 52.7363C65.3904 50.7679 67.0677 47.7851 69.0347 43.7781C71.0116 39.781 72 35.784 72 31.787C72 26.2936 70.3127 21.8245 66.938 18.3798L66.928 18.3597ZM56.704 35.0308C55.6457 36.0752 54.3877 36.5874 52.93 36.5874C51.4723 36.5874 50.2841 36.0752 49.2757 35.0509C48.2673 34.0265 47.7581 32.7712 47.7581 31.2848C47.7581 29.7985 48.2573 28.5431 49.2557 27.4686C50.2542 26.394 51.4423 25.8517 52.8201 25.8517C54.3777 25.8517 55.6756 26.3739 56.724 27.4284C57.7724 28.4728 58.2915 29.7583 58.2915 31.2848C58.2915 32.8113 57.7624 33.9863 56.714 35.0207L56.704 35.0308Z"
        fill={primaryColor}
        stroke={strokeColor}
        strokeWidth="4"
      />
      <text
        x="100"
        y="42"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
        fontSize="24"
        fill={textColor}
        letterSpacing="0.5"
      >
        LEGACY FOUNDATION
      </text>
    </svg>
  );
};

export default J9Logo;
