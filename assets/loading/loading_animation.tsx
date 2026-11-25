import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

const CURRENCIES = [
  { symbol: '$', phaseOffset: 0 },
  { symbol: '€', phaseOffset: 0.75 },
  { symbol: '¥', phaseOffset: 0.5 },
  { symbol: '£', phaseOffset: 0.25 },
];

interface TrexChompLoaderProps {
  width?: number;
  theme?: 'light' | 'dark';
}

export function TrexChompLoader({
  width = 240,
  theme = 'light',
}: TrexChompLoaderProps) {
  const chompAnim = useRef(new Animated.Value(0)).current;
  const streamAnim = useRef(new Animated.Value(0)).current;

  const isDark = theme === 'dark';

  const colors = {
    dinoFill: isDark ? '#2A2A2A' : '#FFFFFF',
    dinoStroke: isDark ? '#FFFFFF' : '#111111',
    eyePupil: isDark ? '#FFFFFF' : '#111111',
    nostril: isDark ? '#181818' : '#111111',
    currency: isDark ? '#7888FF' : '#5265E8',
  };

  useEffect(() => {
    const chompLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chompAnim, {
          toValue: 1,
          duration: 248,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(chompAnim, {
          toValue: 2,
          duration: 165,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(chompAnim, {
          toValue: 0,
          duration: 137,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    const streamLoop = Animated.loop(
      Animated.timing(streamAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );

    chompLoop.start();
    streamLoop.start();

    return () => {
      chompLoop.stop();
      streamLoop.stop();
    };
  }, [chompAnim, streamAnim]);

  const upperJawRotate = chompAnim.interpolate({
    inputRange: [ 0, 1, 2 ],
    outputRange: [ 0, 10, -1.5 ],
  });

  const lowerJawRotate = chompAnim.interpolate({
    inputRange: [ 0, 1, 2 ],
    outputRange: [ 0, -24, 2 ],
  });

  const height = width * (180 / 320);

  return (
    <View style={{ width, height, backgroundColor: 'transparent' }}>
      <Svg width={width} height={height} viewBox="0 0 320 180" fill="none">
        {/* Stream of Currencies Flying Left into the Dino's Mouth */}
        {CURRENCIES.map(({ symbol, phaseOffset }) => {
          const shiftedPhase = Animated.modulo(
            Animated.add(streamAnim, phaseOffset),
            1,
          );

          const translateX = shiftedPhase.interpolate({
            inputRange: [ 0, 0.12, 0.48, 0.72, 0.84, 1 ],
            outputRange: [ 310, 280, 195, 132, 110, 110 ],
          });

          const translateY = shiftedPhase.interpolate({
            inputRange: [ 0, 0.12, 0.48, 0.72, 0.84, 1 ],
            outputRange: [ 114, 111, 117, 114, 114, 114 ],
          });

          const scale = shiftedPhase.interpolate({
            inputRange: [ 0, 0.12, 0.48, 0.72, 0.84, 1 ],
            outputRange: [ 1, 1, 1, 0.85, 0.2, 0 ],
          });

          const opacity = shiftedPhase.interpolate({
            inputRange: [ 0, 0.12, 0.72, 0.84, 1 ],
            outputRange: [ 0, 1, 1, 0, 0 ],
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
                y={9}
                fontSize={26}
                fontWeight="800"
                fill={colors.currency}
                textAnchor="middle"
              >
                {symbol}
              </SvgText>
            </AnimatedG>
          );
        })}

        {/* Exact T-Rex Head from Your Logo (Flipped to Face Right) */}
        <G translateX={275} translateY={-18} scaleX={-1.55} scaleY={1.55}>
          {/* 1. Lower Jaw with Top Lip & Throat Outline */}
          <G translateX={142} translateY={80}>
            <AnimatedG rotation={lowerJawRotate}>
              <G translateX={-142} translateY={-80}>
                {/* Lower Jaw Fill (extends slightly into neck to prevent gaps) */}
                <Path
                  d="
                    M 98 86
                    C 114 93, 132 90, 142 80
                    C 156 80, 168 92, 164 108
                    C 152 108, 134 107, 122 106
                    C 111 105, 102 97, 98 86
                    Z"
                  fill={colors.dinoFill}
                  stroke="none"
                />
                {/* Top of Bottom Jaw + Chin/Throat Outline */}
                <Path
                  d="
                    M 142 80
                    C 132 90, 114 93, 98 86
                    C 102 97, 111 105, 122 106
                    C 134 107, 150 107, 164 106
                  "
                  stroke={colors.dinoStroke}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </G>
            </AnimatedG>
          </G>

          {/* 2. Upper Head & Neck (Inner neck line removed) */}
          <G translateX={142} translateY={80}>
            <AnimatedG rotation={upperJawRotate}>
              <G translateX={-142} translateY={-80}>
                {/* Upper Head Fill */}
                <Path
                  d="
                    M 196.5 112
                    C 196.2 103, 196 95, 196 86
                    C 195 52, 182 32, 152 32
                    C 118 32, 94 42, 94 68
                    C 94 75, 95.5 81, 98 86
                    C 114 93, 132 90, 142 80
                    L 158 106
                    L 196.5 112
                    Z"
                  fill={colors.dinoFill}
                  stroke="none"
                />

                {/* Outer Skull & Smile Stroke Only */}
                <Path
                  d="
                    M 196.5 112
                    C 196.2 103, 196 95, 196 86
                    C 195 52, 182 32, 152 32
                    C 118 32, 94 42, 94 68
                    C 94 75, 95.5 81, 98 86
                    C 114 93, 132 90, 142 80
                  "
                  stroke={colors.dinoStroke}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Exact Cheek Dimple */}
                <Path
                  d="M 139 77 C 142 79, 144 81, 145 84"
                  stroke={colors.dinoStroke}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Exact Eye */}
                <Circle
                  cx={151}
                  cy={59}
                  r={7.5}
                  stroke={colors.dinoStroke}
                  strokeWidth={4.5}
                  fill={colors.dinoFill}
                />
                <Circle cx={153.5} cy={56.5} r={2.6} fill={colors.eyePupil} />

                {/* Exact Nostril */}
                <Circle cx={109} cy={58} r={2.8} fill={colors.nostril} />
              </G>
            </AnimatedG>
          </G>
        </G>
      </Svg>
    </View>
  );
}
