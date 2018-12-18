import {SdStyleProvider} from "../../provider/SdStyleProvider";

export const stylesSdBusyContainer = (vars: SdStyleProvider) => /* language=LESS */ `
  sd-busy-container {
    display: block;
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-width: 70px;
    min-height: 70px;
  
    > ._screen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, .2);
      z-index: ${vars.zIndex.busy};
      visibility: hidden;
      pointer-events: none;
      opacity: 0;
      transition: opacity .3s linear;
  
      > ._rect {
        transform: translateY(-100%);
        transition: .1s ease-in;
        transition-property: transform;
  
        > ._indicator {
          top: 0;
          width: 30px;
          height: 30px;
          margin: 20px auto 0 auto;
          border: 6px solid white;
          border-radius: 100%;
          border-bottom-color: ${vars.themeColor.primary.default};
          animation: _sd-busy-spin 1s linear infinite;
        }
      }
    }
  
    &[sd-busy=true] {
      > ._screen {
        visibility: visible;
        pointer-events: auto;
        opacity: 1;
  
        > ._rect {
          transform: none;
          transition: .1s ease-out;
        }
      }
    }
  }
  
  @keyframes _sd-busy-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }`;