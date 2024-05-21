import { TestBed } from '@angular/core/testing';
import { TabVisibilityService } from '../../src/app/services/tab-visibility.service';

describe('TabVisibilityService', () => {
  let service: TabVisibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TabVisibilityService);
  });

  describe('initializeVisibilityChange', () => {
    it('sets up an event listener on document', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      service['initializeVisibilityChange']();
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('sets lastTabChangeTime when the tab is hidden', () => {
      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });
      service['initializeVisibilityChange']();

      // Trigger visibility change event
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service['lastTabChangeTime']).toBeDefined();
    });

    it('emits tabVisibilityChanged with true when the tab is visible and the time since the last change is more than 10 minutes', () => {
      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
      jest.spyOn(service.tabVisibilityChanged, 'emit');
      service['lastTabChangeTime'] = Date.now() - 600001;
      service['initializeVisibilityChange']();

      // Trigger visibility change event
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service.tabVisibilityChanged.emit).toHaveBeenCalledWith(true);
    });

    it('emits tabVisibilityChanged with false when the tab is visible and the time since the last change is less than 10 minutes', () => {
      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
      jest.spyOn(service.tabVisibilityChanged, 'emit');
      service['lastTabChangeTime'] = Date.now() - 599999;
      service['initializeVisibilityChange']();

      // Trigger visibility change event
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service.tabVisibilityChanged.emit).toHaveBeenCalledWith(false);
    });
  });
});
