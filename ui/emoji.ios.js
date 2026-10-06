/* iPhone: use Apple's own emoji (the system font), so nothing to swap. */
import React from 'react';
import { Text as RNText } from 'react-native';

export const Text = RNText;
export function Emoji({ ch, size = 20, style }) { return <RNText style={[{ fontSize: size * 0.86, lineHeight: size * 1.05, textAlign: 'center' }, style]}>{ch}</RNText>; }
export function Icon({ e, size = 24, style }) { return <Emoji ch={e} size={size} style={style} />; }
