import { injectable, inject } from 'inversify';
import { Event, Emitter, DisposableCollection } from '@theia/core';
import { WidgetFactory } from '@theia/core/lib/browser';
import { Widget } from '@phosphor/widgets';
import { YahahaViewWidget, YahahaViewWidgetFactory ,YahahaSymbolInformationNode } from './yahaha-view-weight';

@injectable()
export class YahahaViewService implements WidgetFactory{
    id='yahaha-view';

    protected widget?: YahahaViewWidget;
    protected readonly onDidChangeOutlineEmitter = new Emitter<YahahaSymbolInformationNode[]>();
    protected readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();
    protected readonly onDidSelectEmitter = new Emitter<YahahaSymbolInformationNode>();
    protected readonly onDidOpenEmitter = new Emitter<YahahaSymbolInformationNode>();

    constructor(@inject(YahahaViewWidgetFactory) protected factory: YahahaViewWidgetFactory) { }

    get onDidSelect(): Event<YahahaSymbolInformationNode> {
        return this.onDidSelectEmitter.event;
    }

    get onDidOpen(): Event<YahahaSymbolInformationNode> {
        return this.onDidOpenEmitter.event;
    }

    get onDidChangeOutline(): Event<YahahaSymbolInformationNode[]> {
        return this.onDidChangeOutlineEmitter.event;
    }

    get onDidChangeOpenState(): Event<boolean> {
        return this.onDidChangeOpenStateEmitter.event;
    }

    get open(): boolean {
        return this.widget !== undefined && this.widget.isVisible;
    }

    publish(roots: YahahaSymbolInformationNode[]): void {
        if (this.widget) {
            this.widget.setOutlineTree(roots);
            this.onDidChangeOutlineEmitter.fire(roots);
        }
    }

    createWidget(): Promise<Widget> {
        this.widget = this.factory();
        const disposables = new DisposableCollection();
        disposables.push(this.widget.onDidChangeOpenStateEmitter.event(open => this.onDidChangeOpenStateEmitter.fire(open)));
        disposables.push(this.widget.model.onOpenNode(node => this.onDidOpenEmitter.fire(node as YahahaSymbolInformationNode)));
        disposables.push(this.widget.model.onSelectionChanged(selection => this.onDidSelectEmitter.fire(selection[0] as YahahaSymbolInformationNode)));
        this.widget.disposed.connect(() => {
            this.widget = undefined;
            disposables.dispose();
        });
        return Promise.resolve(this.widget);
    }
}

