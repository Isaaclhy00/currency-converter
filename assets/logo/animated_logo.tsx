import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import {useTheme} from '../../src/context/ThemeContext';

const AnimatedG = Animated.createAnimatedComponent(G);

const CURRENCIES = [
  { symbol: '€', phaseOffset: 0 },
  { symbol: '$', phaseOffset: 0.75 }, // -1.5s / 6s
  { symbol: '¥', phaseOffset: 0.5 },  // -3.0s / 6s
  { symbol: '£', phaseOffset: 0.25 }, // -4.5s / 6s
];

interface TrexAnimatedLogoProps {
  size?: number;
}

export function TrexAnimatedLogo({ size = 36 }: TrexAnimatedLogoProps) {
  const { isDarkMode } = useTheme();
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const armAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;

  // Theme colors matching your HTML files
  const colors = {
    stroke: isDarkMode ? '#FFFFFF' : '#111111',
    bodyFill: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    eyePupil: isDarkMode ? '#FFFFFF' : '#111111',
    nostril: isDarkMode ? '#181818' : '#111111',
    currency: isDarkMode ? '#FFFFFF' : '#111111',
  };

  useEffect(() => {
    // 1. Subtle Breathing Motion (2.4s loop)
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    // 2. Tiny Arms Juggling Motion (1.2s alternate)
    const armLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(armAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(armAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    // 3. 4 Currencies Orbiting in a Smooth 3D Ring (6s linear loop)
    const orbitLoop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );

    breatheLoop.start();
    armLoop.start();
    orbitLoop.start();

    return () => {
      breatheLoop.stop();
      armLoop.stop();
      orbitLoop.stop();
    };
  }, [breatheAnim, armAnim, orbitAnim]);

  // Breathing interpolations around origin (150, 210)
  const dinoScale = breatheAnim.interpolate({
    inputRange: [ 0, 1 ],
    outputRange: [ 1, 1.018 ],
  });
  const dinoTranslateY = breatheAnim.interpolate({
    inputRange: [ 0, 1 ],
    outputRange: [ 0, -2 ],
  });

  // Arm crank interpolations around origin (155, 142)
  const armTranslateY = armAnim.interpolate({
    inputRange: [ 0, 1 ],
    outputRange: [ -1.5, 1.5 ],
  });
  const armRotate = armAnim.interpolate({
    inputRange: [ 0, 1 ],
    outputRange: [ -2.5, 2.5 ],
  });

  // Maintain 300:250 aspect ratio from original viewBox
  const width = size * (300 / 250);
  const height = size;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 300 250" fill="none">
        {/* T-Rex Body */}
        <AnimatedG
          originX={150}
          originY={210}
          scale={dinoScale}
          translateY={dinoTranslateY}
          stroke={colors.stroke}
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path
            d="
              M 122 106
              C 104 104, 94 88, 94 68
              C 94 42, 118 32, 152 32
              C 182 32, 195 52, 196 86
              C 197 112, 200 132, 202 152
              C 203 172, 200 192, 194 206
              C 198 214, 194 220, 184 220
              L 172 220
              C 166 220, 164 214, 164 205
              C 155 207, 146 207, 139 206
              C 139 214, 137 220, 130 220
              L 116 220
              C 108 220, 106 213, 106 204
              C 80 198, 62 184, 58 168
              C 56 162, 62 158, 68 162
              C 78 168, 92 168, 102 152
              C 108 140, 114 122, 122 106
              Z"
            fill={colors.bodyFill}
          />
          <Path d="M 122 106 C 130 107, 138 107, 145 106" />
          <Path d="M 98 86 C 114 93, 132 90, 142 80" />
          <Path d="M 139 77 C 142 79, 144 81, 145 84" />
          <Circle
            cx={151}
            cy={59}
            r={7.5}
            strokeWidth={4.5}
            fill={colors.bodyFill}
          />
          <Circle cx={153.5} cy={56.5} r={2.6} fill={colors.eyePupil} stroke="none" />
          <Circle cx={109} cy={58} r={2.8} fill={colors.nostril} stroke="none" />
          <Path d="M 103 182 C 104 192, 105 198, 106 204" />
          <Path d="M 164 205 C 170 202, 176 198, 181 193" />
        </AnimatedG>

        {/* Tiny Stubby Arms */}
        <AnimatedG
          originX={155}
          originY={142}
          translateY={armTranslateY}
          rotation={armRotate}
          stroke={colors.stroke}
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path
            d="M 106 132 C 98 138, 102 150, 114 154 C 122 156, 128 152, 126 145 C 125 141, 120 139, 117 138"
            fill={colors.bodyFill}
          />
          <Path
            d="M 192 124 C 204 128, 206 142, 196 150 C 188 156, 179 154, 179 147 C 179 143, 184 140, 188 138"
            fill={colors.bodyFill}
          />
        </AnimatedG>

        {/* 4 Orbiting Currency Symbols */}
        {CURRENCIES.map(({ symbol, phaseOffset }) => {
          const shiftedPhase = Animated.modulo(
            Animated.add(orbitAnim, phaseOffset),
            1,
          );

          const translateX = shiftedPhase.interpolate({
            inputRange: [ 0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1 ],
            outputRange: [ 245, 217, 150, 83, 55, 83, 150, 217, 245 ],
          });
          const translateY = shiftedPhase.interpolate({
            inputRange: [ 0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1 ],
            outputRange: [ 125, 143, 151, 143, 125, 107, 99, 107, 125 ],
          });
          const scale = shiftedPhase.interpolate({
            inputRange: [ 0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1 ],
            outputRange: [ 1, 1.1, 1.15, 1.1, 1, 0.8, 0.72, 0.8, 1 ],
          });
          const opacity = shiftedPhase.interpolate({
            inputRange: [ 0, 0.5, 0.625, 0.75, 0.875, 1 ],
            outputRange: isDarkMode
              ? [ 1, 1, 0.4, 0.25, 0.4, 1 ]
              : [ 1, 1, 0.35, 0.2, 0.35, 1 ],
          });

          return (
            <AnimatedG
              key={symbol}
              translateX={translateX}
              translateY={translateY}
              scale={scale}
              opacity={opacity}
            >
              <SvgText
                x={0}
                y={12}
                fontSize={38}
                fontWeight="800"
                fill={colors.currency}
                textAnchor="middle"
              >
                {symbol}
              </SvgText>
            </AnimatedG>
          );
        })}
      </Svg>
    </View>
  );
}
