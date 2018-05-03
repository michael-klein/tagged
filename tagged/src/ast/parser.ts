import { HTMLParserOptions, ParsedAttributeMap } from "../types/interfaces";

function makeMap(str) {
  const obj: any = {};
  const items: string[] = str.split(",");
  for (var i = 0; i < items.length; i++) obj[items[i]] = true;
  return obj;
}

const START_TAG = /^<([-A-Za-z0-9_]+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;
const END_TAG = /^<\/([-A-Za-z0-9_]+)[^>]*>/;
const ATTR = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

const EMPTY = makeMap(
  "area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed"
);

const BLOCK = makeMap(
  "address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul"
);

const INLINE = makeMap(
  "a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,const"
);

const CLOSE_SELF = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

const FILL_ATTRS = makeMap(
  "checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected"
);

const SPECIAL = makeMap("script,style");
interface Stack<T> extends Array<T> {
  last?: () => string;
}
export function parseHTML(html: string, options: HTMLParserOptions = {}) {
  const stack: Stack<string> = [];
  stack.last = function() {
    return this[this.length - 1];
  };
  let index: number;
  let chars: boolean;
  let match: string[];
  let last: string = html;

  while (html) {
    chars = true;

    if (!stack.last() || !SPECIAL[stack.last()]) {
      if (html.indexOf("<!--") == 0) {
        index = html.indexOf("-->");

        if (index >= 0) {
          if (options.onComment) options.onComment(html.substring(4, index));
          html = html.substring(index + 3);
          chars = false;
        }
      } else if (html.indexOf("</") == 0) {
        match = html.match(END_TAG);

        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(END_TAG, parseEndTag);
          chars = false;
        }
      } else if (html.indexOf("<") == 0) {
        match = html.match(START_TAG);

        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(START_TAG, parseStartTag);
          chars = false;
        }
      }

      if (chars) {
        index = html.indexOf("<");

        var text = index < 0 ? html : html.substring(0, index);
        html = index < 0 ? "" : html.substring(index);

        if (options.onText) options.onText(text);
      }
    } else {
      html = html.replace(
        new RegExp("(.*)</" + stack.last() + "[^>]*>"),
        function(all, text) {
          text = text
            .replace(/<!--(.*?)-->/g, "$1")
            .replace(/<!\[CDATA\[(.*?)]]>/g, "$1");

          if (options.onText) options.onText(text);

          return "";
        }
      );

      parseEndTag("", stack.last());
    }

    if (html == last) throw "Parse Error: " + html;
    last = html;
  }
  parseEndTag();

  function parseStartTag(
    tag?: string,
    tagName?: string,
    rest?: string,
    unary?: boolean
  ): string {
    tagName = tagName.toLowerCase();
    if (BLOCK[tagName]) {
      while (stack.last() && INLINE[stack.last()]) {
        parseEndTag("", stack.last());
      }
    }
    if (CLOSE_SELF[tagName] && stack.last() == tagName) {
      parseEndTag("", tagName);
    }
    unary = EMPTY[tagName] || !!unary;
    if (!unary) stack.push(tagName);
    if (options.onTagOpen) {
      const attrs: ParsedAttributeMap = {};
      rest.replace(ATTR, function(match, name) {
        const value: string = arguments[2]
          ? arguments[2]
          : arguments[3]
            ? arguments[3]
            : arguments[4] ? arguments[4] : FILL_ATTRS[name] ? name : "";
        attrs[name.toLowerCase()] = value;
        return "";
      });
      options.onTagOpen(tagName, attrs, unary);
    }
    return "";
  }

  function parseEndTag(tag?: string, tagName?: string): string {
    let pos: number = -1;
    if (!tagName) pos = 0;
    else
      for (pos = stack.length - 1; pos >= 0; pos--)
        if (stack[pos] == tagName) break;
    if (pos >= 0) {
      for (let i: number = stack.length - 1; i >= pos; i--)
        if (options.onTagClose) options.onTagClose(stack[i]);
      stack.length = pos;
    }
    return "";
  }
}
