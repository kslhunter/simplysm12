import {SdStyleProvider} from "../../provider/SdStyleProvider";

export const stylesSdListItem = (vars: SdStyleProvider) => /* language=LESS */ `
  sd-list-item {
    display: block;

    > label {
      display: block;
      padding: ${vars.gap.sm} ${vars.gap.default};
      transition: background .1s linear;

      > sd-icon {
        float: right;
        transition: transform .1s ease-in;
      }

      &:focus {
        outline-color: transparent;
      }
    }

    > ._child {
      overflow: hidden;

      > ._child-content {
        transition: margin-top .1s ease-out;
        background: rgba(0, 0, 0, .05);
      }
    }

    &[sd-clickable=true] {
      > label {
        cursor: pointer;

        &:hover {
          background: rgba(0, 0, 0, .1);
        }
      }
    }

    &[sd-open=true] {
      > label > sd-icon {
        transform: rotate(-90deg);
        transition: transform .1s ease-out;
      }

      > ._child > ._child-content {
        transition: margin-top .1s ease-in;
      }
    }

    &[sd-header=true] {
      > label {
        cursor: default;
        background: transparent;
        padding: ${vars.gap.xs} ${vars.gap.default};
        color: ${vars.textColor.light};
        font-size: ${vars.fontSize.sm};
        margin-top: ${vars.gap.sm};

        &:hover {
          background: transparent;
        }
      }

      > label > sd-icon {
        display: none;
      }

      > ._child > ._child-content {
        margin-top: 0 !important;
        background: transparent !important;
      }
    }
  }`;