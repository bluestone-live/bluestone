import React from 'react';

interface IProps {
  type: string;
  onClick?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

const CustomIcon = (props: IProps) => {
  const { type, onClick } = props;

  return (
    <svg
      className="custom-icon"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      onClick={onClick}
    >
      <use xlinkHref={`#lh-icon-${type}`} />
    </svg>
  );
};

export default CustomIcon;
