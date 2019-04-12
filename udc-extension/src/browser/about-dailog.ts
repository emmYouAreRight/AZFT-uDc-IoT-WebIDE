import { injectable, inject, postConstruct } from "inversify";
import { DialogProps, AbstractDialog } from "@theia/core/lib/browser/dialogs";


export const UdcDialog_CONTENT_CLASS = "udc-aboutDialog";
export const UdcDialog_EXTENSIONS_CLASS = "udc-aboutExtensions";

@injectable()
export class AboutDialogProps extends DialogProps { }


@injectable()
export class AboutDialog extends AbstractDialog<void>{
    constructor(
        @inject(AboutDialogProps) protected readonly props: AboutDialogProps
    ) {
        super({
            title: props.title
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        const messageNode = document.createElement("div");
        messageNode.classList.add(UdcDialog_CONTENT_CLASS);
        messageNode.textContent = "UDC";
        this.contentNode.appendChild(messageNode);
        this.appendAcceptButton("ok");
    }

    get value(): undefined {
        return undefined;
    }
}

