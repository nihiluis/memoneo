import { Svg, ClipPath, Path, G, Circle, Ellipse, Defs } from "react-native-svg"

interface LogoProps {
  width?: number
  height?: number
}

export default function Logo({ width = 64, height = 64 }: LogoProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 64 64"
      style={{ isolation: "isolate" }}>
      <Defs>
        <ClipPath id="a">
          <Path d="M0 0h64v64H0z" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#a)">
        <Circle
          vectorEffect="non-scaling-stroke"
          cx={898.93229167}
          cy={462.28035579}
          r={18.71964421}
          fill="#A4C9FF"
        />
        <Path
          d="M922.005 472c.042-.648.063-1.304.063-1.965 0-13.017-8.179-23.585-18.254-23.585-10.074 0-18.253 10.568-18.253 23.585 0 .661.021 1.317.062 1.965h36.382z"
          fillRule="evenodd"
          fill="#FFF"
          opacity={0.5}
        />
        <Path
          d="M912.377 472c.041-.648.062-1.304.062-1.965 0-13.017-8.179-23.585-18.253-23.585-10.075 0-18.254 10.568-18.254 23.585 0 .661.021 1.317.063 1.965h36.382z"
          fillRule="evenodd"
          fill="#FFF"
          opacity={0.5}
        />
        <Ellipse
          vectorEffect="non-scaling-stroke"
          cx={898.93229167}
          cy={472}
          rx={23}
          ry={5.5}
          fill="#FFF"
          opacity={0.5}
        />
        <Path
          d="M5.906 32c0-14.35 11.65-26 26-26s26 11.65 26 26-11.65 26-26 26-26-11.65-26-26z"
          fill="#A4C9FF"
        />
        <Path
          d="M50.335 13.694c4.684 4.688 7.571 11.162 7.571 18.306 0 4.942-1.382 9.564-3.78 13.5H13.421c-.058-.9-.087-1.811-.087-2.73 0-18.079 11.36-32.757 25.353-32.757 4.201 0 8.165 1.323 11.648 3.681z"
          fillRule="evenodd"
          fill="#FFF"
          fillOpacity={0.5}
        />
        <Path
          d="M13.034 14.138C8.614 18.791 5.906 25.082 5.906 32c0 4.942 1.382 9.564 3.78 13.5h40.893c.058-.9.087-1.811.087-2.73 0-18.079-11.36-32.757-25.353-32.757-4.457 0-8.648 1.489-12.279 4.125z"
          fillRule="evenodd"
          fill="#FFF"
          fillOpacity={0.5}
        />
        <Path
          d="M56.437 40.618c-1.578 4.498-4.361 8.43-7.973 11.397-4.8.717-10.482 1.124-16.558 1.124-6.076 0-11.758-.407-16.558-1.124-3.612-2.967-6.395-6.899-7.973-11.397 5.843-1.686 14.668-2.757 24.531-2.757s18.688 1.071 24.531 2.757z"
          fillRule="evenodd"
          fill="#FFF"
          fillOpacity={0.5}
        />
      </G>
    </Svg>
  )
}
