// Logic layer adapters: Zag.js state machines mapped onto contract anatomy parts.
// Each adapter is a hook. The contract's `behavior` field names the adapter; part names must match.
import { useId } from "react";
import * as dialog from "@zag-js/dialog";
import * as tabs from "@zag-js/tabs";
import * as zswitch from "@zag-js/switch";
import * as tooltip from "@zag-js/tooltip";
import * as popover from "@zag-js/popover";
import * as menu from "@zag-js/menu";
import { normalizeProps, useMachine } from "@zag-js/react";
import type { Behavior } from "./index.ts";

const useDialog: Behavior = ({ props }) => {
  const service = useMachine(dialog.machine, { id: useId(), defaultOpen: props.open === true });
  const api = dialog.connect(service, normalizeProps);
  return {
    parts: {
      trigger: api.getTriggerProps(),
      backdrop: api.getBackdropProps(),
      positioner: { ...api.getPositionerProps(), hidden: !api.open }, // Zag hides backdrop and content, not the positioner
      content: api.getContentProps(),
      title: api.getTitleProps(),
      description: api.getDescriptionProps(),
      close: api.getCloseTriggerProps(),
    },
    expose: api,
  };
};

const useTabs: Behavior = ({ props }) => {
  const service = useMachine(tabs.machine, { id: useId(), defaultValue: props.defaultValue === undefined ? undefined : String(props.defaultValue) });
  const api = tabs.connect(service, normalizeProps);
  return { parts: { root: api.getRootProps(), list: api.getListProps() }, expose: api };
};

const requireParent = <T>(parent: unknown, owner: string, child: string): T => {
  if (!parent) throw new Error(`${child} must be placed inside ${owner}`);
  return parent as T;
};

const useTab: Behavior = ({ props, parent }) => ({
  parts: { root: requireParent<tabs.Api>(parent, "ds.tabs", "ds.tab").getTriggerProps({ value: String(props.value) }) },
});

const useTabPanel: Behavior = ({ props, parent }) => ({
  parts: { root: requireParent<tabs.Api>(parent, "ds.tabs", "ds.tab-panel").getContentProps({ value: String(props.value) }) },
});

const useSwitch: Behavior = ({ props }) => {
  const service = useMachine(zswitch.machine, {
    id: useId(),
    defaultChecked: props.checked === true,
    disabled: props.disabled === true,
    name: props.name === undefined ? undefined : String(props.name),
  });
  const api = zswitch.connect(service, normalizeProps);
  return {
    parts: {
      root: api.getRootProps(),
      input: { ...api.getHiddenInputProps(), role: "switch" }, // Zag leaves it a plain checkbox
      control: api.getControlProps(),
      thumb: api.getThumbProps(),
      label: api.getLabelProps(),
    },
    expose: api,
  };
};

const useTooltip: Behavior = () => {
  const service = useMachine(tooltip.machine, { id: useId(), openDelay: 300, closeDelay: 100 });
  const api = tooltip.connect(service, normalizeProps);
  return {
    parts: { trigger: api.getTriggerProps(), positioner: { ...api.getPositionerProps(), hidden: !api.open }, content: api.getContentProps() },
    expose: api,
  };
};

const usePopover: Behavior = () => {
  const service = useMachine(popover.machine, { id: useId() });
  const api = popover.connect(service, normalizeProps);
  return {
    parts: {
      trigger: api.getTriggerProps(),
      positioner: { ...api.getPositionerProps(), hidden: !api.open },
      content: api.getContentProps(),
      title: api.getTitleProps(),
      description: api.getDescriptionProps(),
    },
    expose: api,
  };
};

const useMenu: Behavior = () => {
  const service = useMachine(menu.machine, { id: useId() });
  const api = menu.connect(service, normalizeProps);
  return {
    parts: { trigger: api.getTriggerProps(), positioner: { ...api.getPositionerProps(), hidden: !api.open }, content: api.getContentProps() },
    expose: api,
  };
};

const useMenuItem: Behavior = ({ props, parent }) => ({
  parts: { root: requireParent<menu.Api>(parent, "ds.menu", "ds.menu-item").getItemProps({ value: String(props.value) }) },
});

export const zagBehaviors: Record<string, Behavior> = {
  dialog: useDialog,
  tabs: useTabs,
  "tabs.trigger": useTab,
  "tabs.panel": useTabPanel,
  switch: useSwitch,
  tooltip: useTooltip,
  popover: usePopover,
  menu: useMenu,
  "menu.item": useMenuItem,
};
