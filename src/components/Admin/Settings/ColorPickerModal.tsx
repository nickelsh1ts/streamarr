'use client';

import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { HslColor } from 'colord';
import { colord } from 'colord';
import Modal from '@app/components/Common/Modal';
import {
  rgbToOklch,
  getAllTailwindColors,
  oklchToRgb,
} from '@app/utils/themeUtils';
import Button from '@app/components/Common/Button';
import {
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  SwatchIcon,
} from '@heroicons/react/24/solid';
import type { Theme } from '@server/lib/settings';
import { CircleStackIcon, CubeIcon } from '@heroicons/react/24/outline';
import DropDownMenu from '@app/components/Common/DropDownMenu';

interface ColorPickerModalProps {
  colorName: string;
  theme: Theme;
  onSave: (color: string) => void;
  onClose: () => void;
  show: boolean;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  colorName,
  theme,
  onSave,
  onClose,
  show,
}) => {
  const [color, setColor] = useState(theme[colorName]);
  const [tab, setTab] = useState<'picker' | 'sliders' | 'palette'>('palette');
  const [hsl, setHsl] = useState<HslColor>(colord(theme[colorName]).toHsl());
  const [format, setFormat] = useState<'hex' | 'rgb' | 'hsl' | 'oklch'>(
    'oklch'
  );

  const formatOptions = [
    {
      value: 'oklch' as const,
      label: 'OKLCH',
      icon: (
        <svg
          className="size-4 p-0.25 text-primary inline-block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <g
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
          >
            <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
          </g>
        </svg>
      ),
    },
    {
      value: 'hsl' as const,
      label: 'HSL',
      icon: <CircleStackIcon className="size-4 text-primary inline-block" />,
    },
    {
      value: 'rgb' as const,
      label: 'RGB',
      icon: <CubeIcon className="size-4 text-primary inline-block" />,
    },
    {
      value: 'hex' as const,
      label: 'Hex',
      icon: <CubeIcon className="size-4 text-primary inline-block" />,
    },
  ];

  useEffect(() => {
    if (show && theme[colorName]) {
      setColor(theme[colorName]);
    }
  }, [colorName, show, theme]);

  useEffect(() => {
    setHsl(colord(color).toHsl());
  }, [color]);

  const getFormattedValue = () => {
    const c = colord(color);
    switch (format) {
      case 'hex': {
        return c.toHex();
      }
      case 'rgb': {
        const rgb = c.toRgb();
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      }
      case 'hsl': {
        const h = c.toHsl();
        return `hsl(${h.h}, ${h.s}%, ${h.l}%)`;
      }
      case 'oklch': {
        const oklch = rgbToOklch(c.toRgb().r, c.toRgb().g, c.toRgb().b);
        return `oklch(${oklch.l.toFixed(3)} ${oklch.c.toFixed(
          3
        )} ${oklch.h.toFixed(3)})`;
      }
      default:
        return c.toHex();
    }
  };

  const parseInput = (value: string) => {
    try {
      const trimmed = value.trim();
      // Attempt oklch parsing first: okLch(L C H) where L and C are numbers and H is degrees
      const oklchMatch = trimmed.match(
        /oklch\(\s*([0-9]*\.?[0-9]+%?)\s+([0-9]*\.?[0-9]+%?)\s+([0-9]*\.?[0-9]+(?:deg)?%?)\s*\)/i
      );
      if (oklchMatch) {
        const Lraw = oklchMatch[1];
        const Craw = oklchMatch[2];
        const Hraw = oklchMatch[3];
        const L = Lraw.endsWith('%')
          ? parseFloat(Lraw) / 100
          : parseFloat(Lraw);
        const C = Craw.endsWith('%')
          ? parseFloat(Craw) / 100
          : parseFloat(Craw);
        const H = parseFloat(Hraw.replace(/deg/i, '').replace('%', ''));
        const rgb = oklchToRgb(L, C, H);
        setColor(colord({ r: rgb.r, g: rgb.g, b: rgb.b }).toHex());
        return;
      }

      const c = colord(trimmed);
      if (c.isValid()) {
        setColor(c.toHex());
      }
    } catch {
      // ignore invalid
    }
  };

  const updateFromHsl = (newHsl: Partial<HslColor>) => {
    const updated = { ...hsl, ...newHsl };
    setHsl(updated);
    setColor(colord(updated).toHex());
  };

  // Local editable input state so users can type values
  const [inputValue, setInputValue] = useState<string>(getFormattedValue());

  useEffect(() => {
    // keep the input in sync when the color changes externally
    setInputValue(getFormattedValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, format]);

  const presets = getAllTailwindColors();
  const currentOption = formatOptions.find((opt) => opt.value === format);

  return (
    <Modal
      show={show}
      onCancel={() => {
        onSave(color);
        onClose();
      }}
      size="md"
    >
      <div className="-mt-4">
        <div className="flex justify-center sm:justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center shrink-0 max-sm:w-full">
            <div
              className="w-10 h-7 rounded-md items-center justify-center flex"
              style={{
                background: colorName?.includes('base-content')
                  ? theme['base-300']
                  : colorName?.includes('-content')
                    ? theme[`${colorName.replace('-content', '')}`]
                    : color,
                color: colorName?.includes('-content')
                  ? color
                  : theme[`${colorName}-content`],
              }}
            >
              <div className="text-xl font-extrabold">A</div>
            </div>
            {colorName?.includes('-content') ? (
              <div className="divider my-auto w-10 mr-2 -ml-4" />
            ) : (
              <div className="divider my-auto w-6 mr-2" />
            )}
            <p className="text-neutral">
              Pick a color for{' '}
              <span className="text-white">{colorName?.replace('-', ' ')}</span>
            </p>
          </div>
          <div className="flex items-center mr-2 bg-base-200 p-1 rounded-lg gap-1">
            <Button
              buttonType={tab === 'palette' ? 'primary' : 'ghost'}
              buttonSize="sm"
              onClick={() => setTab('palette')}
            >
              <Squares2X2Icon className="size-6 mr-2" /> Palette
            </Button>
            <Button
              buttonType={tab === 'picker' ? 'primary' : 'ghost'}
              buttonSize="sm"
              onClick={() => setTab('picker')}
            >
              <SwatchIcon className="size-6 mr-2" /> Picker
            </Button>
            <Button
              buttonType={tab === 'sliders' ? 'primary' : 'ghost'}
              buttonSize="sm"
              onClick={() => setTab('sliders')}
            >
              <AdjustmentsHorizontalIcon className="size-6 mr-2" /> Sliders
            </Button>
          </div>
        </div>
        {tab === 'palette' && (
          <div className="grid grid-cols-11 lg:grid-flow-col lg:grid-rows-11 gap-1">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                className="btn btn-xs size-7 rounded-full"
                style={{ backgroundColor: preset }}
                onClick={() => setColor(preset)}
                title={preset}
              />
            ))}
          </div>
        )}
        {tab === 'picker' && (
          <div className="w-full justify-center flex my-8">
            <HexColorPicker color={color} onChange={setColor} />
          </div>
        )}
        {tab === 'sliders' && (
          <div className="space-y-8 mb-8 mt-12 sm:mx-8">
            <div>
              <div className="label">
                <span className="text-xs text-neutral">Hue: {hsl.h}&deg;</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={(e) => updateFromHsl({ h: parseInt(e.target.value) })}
                className="range range-lg pe-2 rounded-md text-transparent custom-range [&.range::-webkit-slider-thumb]:ms-1 [&.range::-webkit-slider-thumb]:size-6 [&.range::-webkit-slider-thumb]:shadow-[0_0_0_1px_oklch(0_0_0/.3)_inset,0_0_0_2px_oklch(100_0_0)_inset] [&.range::-webkit-slider-thumb]:rounded-lg [&.range::-webkit-slider-thumb]:bg-transparent"
                style={{
                  background:
                    'linear-gradient(to right, rgb(255, 84, 84), rgb(255, 186, 84), rgb(221, 255, 84), rgb(118, 255, 84), rgb(84, 255, 152), rgb(84, 255, 255), rgb(84, 152, 255), rgb(118, 84, 255), rgb(221, 84, 255), rgb(255, 84, 186), rgb(255, 84, 84))',
                }}
              />
            </div>
            <div>
              <div className="label">
                <span className="text-xs text-neutral">
                  Saturation: {hsl.s}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.s}
                onChange={(e) => updateFromHsl({ s: parseInt(e.target.value) })}
                className={`range range-lg pe-2 rounded-md text-transparent custom-range [&.range::-webkit-slider-thumb]:ms-1 [&.range::-webkit-slider-thumb]:size-6 [&.range::-webkit-slider-thumb]:shadow-[0_0_0_1px_oklch(0_0_0/.3)_inset,0_0_0_2px_oklch(100_0_0)_inset] [&.range::-webkit-slider-thumb]:rounded-lg [&.range::-webkit-slider-thumb]:bg-transparent`}
                style={{
                  background: `linear-gradient(to right, ${colord({ h: hsl.h, s: 0, l: hsl.l }).toHex()}, ${colord({ h: hsl.h, s: 100, l: hsl.l }).toHex()})`,
                }}
              />
            </div>
            <div>
              <div className="label">
                <span className="text-xs text-neutral">
                  Lightness: {hsl.l}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(e) => updateFromHsl({ l: parseInt(e.target.value) })}
                className={`range range-lg pe-2 rounded-md text-transparent custom-range [&.range::-webkit-slider-thumb]:ms-1 [&.range::-webkit-slider-thumb]:size-6 [&.range::-webkit-slider-thumb]:shadow-[0_0_0_1px_oklch(0_0_0/.3)_inset,0_0_0_2px_oklch(100_0_0)_inset] [&.range::-webkit-slider-thumb]:rounded-lg [&.range::-webkit-slider-thumb]:bg-transparent`}
                style={{
                  background: `linear-gradient(to right, rgb(0, 0, 0), ${colord({ h: hsl.h, s: hsl.s, l: 50 }).toHex()}, rgb(191, 191, 191))`,
                }}
              />
            </div>
          </div>
        )}
        <div className="">
          <div className="divider divider-primary w-full" />
          <span className="text-xs text-neutral">Color Value</span>
          <div className="flex space-x-2">
            <DropDownMenu
              dropUp
              side="left"
              title="Convert Format"
              dropdownIcon={
                <span className="flex items-center gap-1">
                  {currentOption?.icon} {currentOption?.label}
                </span>
              }
              buttonType="primary"
              size="sm"
              className="btn btn-sm btn-ghost shadow-lg"
            >
              {formatOptions.map((option) => (
                <DropDownMenu.Item
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={`rounded-none py-2 hover:bg-primary-content/10 ${currentOption?.value === option.value && 'bg-primary/20'}`}
                >
                  <span className="flex items-center gap-1">
                    {option.icon} {option.label}
                  </span>
                </DropDownMenu.Item>
              ))}
            </DropDownMenu>
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() => parseInput(inputValue)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') parseInput(inputValue);
                }}
                className="input input-primary input-sm w-full tracking-widest"
                placeholder={getFormattedValue()}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ColorPickerModal;
