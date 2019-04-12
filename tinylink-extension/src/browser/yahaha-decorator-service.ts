import { inject, injectable, named } from 'inversify';
import { ContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { TreeDecorator, AbstractTreeDecoratorService } from '@theia/core/lib/browser/tree/tree-decorator';

/**
 * Symbol for all decorators that would like to contribute into the outline.
 */
export const YahahaTreeDecorator = Symbol('YahahaTreeDecorator');

/**
 * Decorator service for the outline.
 */
@injectable()
export class YahahaDecoratorService extends AbstractTreeDecoratorService {
    constructor(@inject(ContributionProvider) @named(YahahaTreeDecorator) protected readonly contributions: ContributionProvider<TreeDecorator>) {
        super(contributions.getContributions());
    }

}


