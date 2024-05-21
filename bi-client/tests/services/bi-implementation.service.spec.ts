import { TestBed } from '@angular/core/testing';
import { BiImplementationService } from '../../src/app/services/bi-implementation.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { GetBiReport } from '../../src/app/shared/api.interface';

describe('NavigationBarService', () => {
  // let powerbi: pbi.service.Service;
  let _mockReport: any;
  let service: BiImplementationService;
  const getBiReport: GetBiReport = {
    token: 'token',
    azureValidation: 1,
    filters: [],
    report: {
      id: 1,
      report_name: 'testName',
      report_title: 'testTitle',
      report_description: 'testDescription',
      report_id: 'testId',
      dataset_id: 'testDatasetId',
      group_id: 'testGroupId',
      is_active: 1,
      has_rls_security: 1,
      report_order: 1,
      has_full_screen: 1,
      embed_url: 'testEmbedUrl',
      mainPage: 'testMainPage'
    }
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'testId', testVariable: '1,2,3' })
          }
        }
      ]
    });
    service = TestBed.inject(BiImplementationService);

    _mockReport = {
      on: jest.fn(),
      off: jest.fn(),
      bookmarksManager: {
        getBookmarks: jest.fn().mockResolvedValue([
          { name: '1', displayName: 'Bookmark 1' },
          { name: '2', displayName: 'Bookmark 2' }
        ])
      }
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBiReportWithCredentialsById', () => {
    it('should return a BiReport', () => {
      const biReport = service.getBiReportWithCredentialsById('testId');
      expect(biReport).toBeTruthy();
    });
  });
  describe('getBiReports', () => {
    it('should return an array of BiReports', () => {
      const biReports = service.getBiReports();
      expect(biReports).toBeTruthy();
    });
  });
  describe('getBiReportWithCredentialsByreportName', () => {
    it('should return a BiReport', () => {
      const biReport = service.getBiReportWithCredentialsByreportName({
        report_name: 'testName',
        subpage_id: 'testId'
      });
      expect(biReport).toBeTruthy();
    });
  });
  describe('renderReport', () => {
    it('should return a BiReport', () => {
      const biReport = service.renderReport(getBiReport, 'testName', 'testPage');
      expect(biReport).toBeTruthy();
    });
  });
  describe('convertVariableToList', () => {
    it('should return a list of variables', () => {
      const variables = service.convertVariableToList('1,2,3', 'int');
      expect(variables).toEqual([1, 2, 3]);
    });
    it('should return a list of variables', () => {
      const variables = service.convertVariableToList('1,2,3', 'string');
      expect(variables).toEqual(['1', '2', '3']);
    });
  });
  describe('applyFilters', () => {
    it('should return a list of variables', () => {
      service.applyFilters([
        {
          id: 1,
          report_id: 1,
          variablename: 'testVariable',
          scope: 'testScope',
          table: 'testTable',
          column: 'testColumn',
          operator: 'testOperator',
          param_type: 'int'
        }
      ]);
    });
  });
  describe('getReportName', () => {
    it('should return a list of variables', () => {
      const reportName = service.getReportName();
      expect(reportName).toBeTruthy();
    });
  });
  describe('getBookmarkName', () => {
    it('should return a list of variables', () => {
      const bookmarkName = service.getBookmarkName(_mockReport, 1);
      expect(bookmarkName).toBeTruthy();
    });
  });
  describe('detectButtonAndTable', () => {
    it('Shoud return undefined if bookmarkName is not found', async () => {
      const buttonAndTable = await service.detectButtonAndTable(_mockReport, undefined);
      expect(buttonAndTable).toBe(0);
    });
    it('should return a list of variables', () => {
      const buttonAndTable = service.detectButtonAndTable(_mockReport, 'export_data');
      expect(buttonAndTable).toBeTruthy();
    });
    it('should process the export when bookmarkName is "export_data"', async () => {
      // Mock the necessary methods to reach inside the try block
      const mockGetPages = jest.fn().mockResolvedValue([
        {
          isActive: true,
          getVisuals: jest
            .fn()
            .mockResolvedValue([{ title: { search: jest.fn().mockReturnValue(0) } }])
        }
      ]);
      _mockReport.getPages = mockGetPages;

      const mockExportData = jest.fn().mockResolvedValue({ data: 'mockData' });
      const visual = { exportData: mockExportData };
      _mockReport.visual = visual;

      await service.detectButtonAndTable(_mockReport, 'export_data');

      expect(mockGetPages).toHaveBeenCalled();
    });
  });
});
