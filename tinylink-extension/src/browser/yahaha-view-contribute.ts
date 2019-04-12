import { injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { YahahaViewWidget } from './yahaha-view-weight';


export const YAHAHA_WIDGET_FACTORY_ID = 'yahaha-view';

@injectable()
export class YahahaViewContribution extends AbstractViewContribution<YahahaViewWidget> implements FrontendApplicationContribution{

    constructor() {
        super({
            widgetId: YAHAHA_WIDGET_FACTORY_ID,
            widgetName: 'yahaha',
            defaultWidgetOptions: {
                area: 'left',
                rank: 500
            },
            toggleCommandId: 'yahahaview:toggle',
            toggleKeybinding: 'ctrlcmd+shift+y'
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }
}


