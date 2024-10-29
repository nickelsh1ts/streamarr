import React from 'react';
import ReactDOM from 'react-dom';
import type { Config } from 'react-popper-tooltip';
import { usePopperTooltip } from 'react-popper-tooltip';

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  tooltipConfig?: Partial<Config>;
  className?: string;
};

const Tooltip = ({
  children,
  content,
  tooltipConfig,
  className,
}: TooltipProps) => {
  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } =
    usePopperTooltip({
      followCursor: false,
      offset: [0, 10],
      placement: 'bottom',
      ...tooltipConfig,
    });

  const tooltipStyle = [
    'z-50 text-sm absolute font-normal bg-[#202629] border-1 border-black backdrop-blur px-2 py-3 tracking-wide rounded-md shadow-3xl shadow-black/80 text-primary-content capitalize',
  ];

  if (className) {
    tooltipStyle.push(className);
  }

  return (
    <>
      {React.cloneElement(children, { ref: setTriggerRef })}
      {visible &&
        content &&
        ReactDOM.createPortal(
          <div
            ref={setTooltipRef}
            {...getTooltipProps({
              className: tooltipStyle.join(' '),
            })}
          >
            <span
              style={{
                transformOrigin: 'center 0px',
              }}
              className="absolute top-0 rotate-180 left-7"
            >
              <svg
                className="fill-[#202629] block w-4 h-2"
                viewBox="0 0 30 10"
                preserveAspectRatio="none"
              >
                <polygon points="0,0 30,0 15,10"></polygon>
              </svg>
            </span>
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
