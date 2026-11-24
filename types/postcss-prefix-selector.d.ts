declare module 'postcss-prefix-selector' {
  import { PluginCreator } from 'postcss';
  type Options = {
    prefix: string;
    exclude?: (string | RegExp)[];
    transform?: (prefix: string, selector: string, prefixedSelector: string, filePath?: string, rule?: unknown) => string;
    includeFiles?: (string | RegExp)[];
    ignoreFiles?: (string | RegExp)[];
  };
  const plugin: PluginCreator<Options>;
  export default plugin;
}
