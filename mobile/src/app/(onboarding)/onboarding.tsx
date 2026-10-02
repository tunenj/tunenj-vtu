import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    FlatList,
    LayoutAnimation,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import onboardingImage1 from '../../../assets/images/onboarding-1.png';
import onboardingImage3 from '../../../assets/images/onboarding-3.png';

type Slide = {
    id: string;
    image: ImageSourcePropType;
    label: string;
    title: string;
    highlight: string; // coloured word at the end of the title
    text: string;
    chipIcon: keyof typeof Ionicons.glyphMap;
    chipText: string;
};

const slides: Slide[] = [
    {
        id: '1',
        image: onboardingImage1,
        label: 'Phone showing a successful airtime top-up',
        title: 'Top up in ',
        highlight: 'seconds',
        text: 'Buy airtime and data for MTN, Airtel, Glo and 9mobile, any time you need it.',
        chipIcon: 'checkmark-circle',
        chipText: '₦1,000 airtime sent',
    },
    {
        id: '2',
        image: onboardingImage3,
        label: 'Wallet protected by a shield',
        title: 'Fast, safe and ',
        highlight: 'tracked',
        text: 'Fund your wallet once, pay with a secure PIN, and see every transaction and receipt.',
        chipIcon: 'lock-closed',
        chipText: 'PIN protected',
    },
];

const TEXT_AREA_MIN = 170;
const CONTROLS_AREA = 150;
const GRADIENT_COLORS = ['#4A3AE8', '#281C9D', '#1A1266'] as const;
const ARCH_BASE = 300; // size of the circle that is stretched into the arch
const ARCH_RISE = 56; // how far the arch rises above the sheet

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Slide>);

/** Rings that pulse outward, like the signal wave in the Tunenj logo */
function SignalRings({ size }: { size: number }) {
    const [values] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

    useEffect(() => {
        const runs = values.map((v, i) =>
            Animated.sequence([
                Animated.delay(i * 900),
                Animated.loop(
                    Animated.timing(v, {
                        toValue: 1,
                        duration: 2700,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    })
                ),
            ])
        );
        runs.forEach((r) => r.start());
        return () => runs.forEach((r) => r.stop());
    }, [values]);

    return (
        <>
            {values.map((v, i) => (
                <Animated.View
                    key={i}
                    style={{
                        position: 'absolute',
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: 1.5,
                        borderColor: 'rgba(255,255,255,0.55)',
                        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                        transform: [
                            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.9] }) },
                        ],
                    }}
                />
            ))}
        </>
    );
}

/** Small card that bobs up and down */
function FloatChip({
    icon,
    text,
    style,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
    style: object;
}) {
    const [v] = useState(() => new Animated.Value(0));

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(v, {
                    toValue: 1,
                    duration: 1700,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(v, {
                    toValue: 0,
                    duration: 1700,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [v]);

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    transform: [
                        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                    ],
                },
                style,
            ]}
            className="flex-row items-center gap-1.5 rounded-full bg-white px-3 py-2"
        >
            <Ionicons name={icon} size={16} color="#5A4EE6" />
            <Text className="text-xs font-semibold text-brand-night">{text}</Text>
        </Animated.View>
    );
}

export default function Onboarding() {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const listRef = useRef<FlatList<Slide>>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [index, setIndex] = useState(0);

    const isFirst = index === 0;
    const isLast = index === slides.length - 1;

    const textArea = Math.max(TEXT_AREA_MIN, height * 0.2);
    const controlsHeight = CONTROLS_AREA + insets.bottom;
    const sheetHeight = textArea + controlsHeight;
    const topAreaHeight = height - sheetHeight;
    const imageSize = Math.min(width * 0.78, topAreaHeight * 0.82);

    useEffect(() => {
        listRef.current?.scrollToIndex({ index, animated: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width]);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            const nextIdx = viewableItems[0]?.index;
            if (nextIdx != null) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIndex(nextIdx);
                Haptics.selectionAsync().catch(() => {});
            }
        },
        []
    );

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const finish = useCallback(async () => {
        try {
            await AsyncStorage.setItem('hasOnboarded', 'true');
        } catch {
            // never block navigation
        }
        router.replace('/login');
    }, []);

    const goTo = useCallback((i: number) => {
        if (i < 0 || i > slides.length - 1) return;
        listRef.current?.scrollToIndex({ index: i, animated: true });
    }, []);

    const handleCTA = useCallback(() => {
        if (isLast) finish();
        else goTo(index + 1);
    }, [finish, goTo, index, isLast]);

    const renderItem = useCallback(
        ({ item, index: i }: { item: Slide; index: number }) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const translateX = scrollX.interpolate({
                inputRange,
                outputRange: [width * 0.18, 0, -width * 0.18],
                extrapolate: 'clamp',
            });
            const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.88, 1, 0.88],
                extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.35, 1, 0.35],
                extrapolate: 'clamp',
            });

            return (
                <View style={{ width, height }}>
                    {/* HERO */}
                    <View
                        style={{ height: topAreaHeight, paddingTop: insets.top }}
                        className="items-center justify-center"
                    >
                        <Animated.View
                            style={{
                                width: imageSize,
                                height: imageSize,
                                opacity,
                                transform: [{ translateX }, { scale }],
                            }}
                        >
                            <Animated.Image
                                accessibilityLabel={item.label}
                                source={item.image}
                                resizeMode="contain"
                                style={{ width: imageSize, height: imageSize }}
                            />
                            <FloatChip
                                icon={item.chipIcon}
                                text={item.chipText}
                                style={{ top: imageSize * 0.04, right: -imageSize * 0.06 }}
                            />
                        </Animated.View>
                    </View>

                    {/* SHEET with an arched top, echoing the "n" in the logo */}
                    <View style={{ height: sheetHeight }} className="items-center">
                        <View
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                top: -ARCH_RISE,
                                left: (width - ARCH_BASE) / 2,
                                width: ARCH_BASE,
                                height: ARCH_BASE,
                                borderRadius: ARCH_BASE / 2,
                                backgroundColor: '#FFFFFF',
                                transform: [{ scaleX: (width * 1.5) / ARCH_BASE }],
                            }}
                        />
                        <View
                            pointerEvents="none"
                            style={{ position: 'absolute', top: 120, bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF' }}
                        />

                        <Text
                            maxFontSizeMultiplier={1.3}
                            className="px-8 pt-8 text-center text-[28px] font-bold leading-[34px] tracking-[-0.4px] text-brand-night"
                        >
                            {item.title}
                            <Text className="text-brand-signal">{item.highlight}</Text>
                        </Text>

                        <Text
                            maxFontSizeMultiplier={1.3}
                            style={{ maxWidth: width * 0.85 }}
                            className="mt-2.5 text-center text-base leading-6 text-brand-night/70"
                        >
                            {item.text}
                        </Text>
                    </View>
                </View>
            );
        },
        [width, height, insets.top, topAreaHeight, sheetHeight, imageSize, scrollX]
    );

    return (
        <View className="flex-1 bg-brand-night">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Full-screen gradient */}
            <LinearGradient
                colors={[...GRADIENT_COLORS]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {/* Signal rings, fixed behind the slides */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: topAreaHeight,
                    paddingTop: insets.top,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <SignalRings size={imageSize * 0.9} />
            </View>

            {/* Skip pill */}
            {!isLast && (
                <Pressable
                    onPress={finish}
                    accessibilityRole="button"
                    accessibilityLabel="Skip onboarding"
                    style={{ top: insets.top + 12 }}
                    className="absolute right-5 z-10 rounded-full bg-white/10 px-3.5 py-1.5 active:bg-white/25"
                >
                    <Text className="text-sm font-semibold text-white">Skip</Text>
                </Pressable>
            )}

            {/* Slides */}
            <AnimatedFlatList
                ref={listRef}
                data={slides}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScrollToIndexFailed={(info) => {
                    listRef.current?.scrollToOffset({
                        offset: info.averageItemLength * info.index,
                        animated: true,
                    });
                }}
                renderItem={renderItem}
            />

            {/* CONTROLS */}
            <View
                pointerEvents="box-none"
                style={{ height: controlsHeight, paddingBottom: insets.bottom + 12 }}
                className="absolute inset-x-0 bottom-0 justify-end px-6"
            >
                <View className="mb-5 flex-row items-center justify-between">
                    {isFirst ? (
                        <View className="h-11 w-11" />
                    ) : (
                        <Pressable
                            onPress={() => goTo(index - 1)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Previous slide"
                            className="h-11 w-11 items-center justify-center rounded-full bg-brand-air active:opacity-70"
                        >
                            <Ionicons name="chevron-back" size={24} color="#281C9D" />
                        </Pressable>
                    )}

                    <View
                        accessibilityLabel={`Slide ${index + 1} of ${slides.length}`}
                        className="flex-row items-center gap-2"
                    >
                        {slides.map((s, i) => (
                            <View
                                key={s.id}
                                className={`h-2 rounded-full ${i === index ? 'w-8 bg-brand' : 'w-2 bg-brand-mist'}`}
                            />
                        ))}
                    </View>

                    {isLast ? (
                        <View className="h-11 w-11" />
                    ) : (
                        <Pressable
                            onPress={() => goTo(index + 1)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Next slide"
                            className="h-11 w-11 items-center justify-center rounded-full bg-brand-air active:opacity-70"
                        >
                            <Ionicons name="chevron-forward" size={24} color="#281C9D" />
                        </Pressable>
                    )}
                </View>

                <Pressable
                    onPress={handleCTA}
                    accessibilityRole="button"
                    accessibilityLabel="Get started"
                    className="overflow-hidden rounded-2xl active:opacity-90"
                >
                    <LinearGradient
                        colors={['#4A3AE8', '#281C9D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            height: 56,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            paddingHorizontal: 24,
                        }}
                    >
                        <Text className="text-[17px] font-bold tracking-wide text-white">
                            Get started
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}